import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App';
import { weatherDataMock } from '../../src/mocks/weatherData';
import { getWeather, searchCities, WeatherServiceError } from '../../src/services/weatherService';

vi.mock('../../src/services/weatherService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/services/weatherService')>();
  return { ...actual, searchCities: vi.fn(), getWeather: vi.fn() };
});

const searchCitiesMock = vi.mocked(searchCities);
const getWeatherMock = vi.mocked(getWeather);

beforeEach(() => {
  vi.resetAllMocks();
  searchCitiesMock.mockResolvedValue([weatherDataMock.city]);
  getWeatherMock.mockResolvedValue(weatherDataMock);
});

function submitCity(city: string) {
  fireEvent.change(screen.getByRole('searchbox', { name: 'Cidade' }), {
    target: { value: city },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));
}

async function selectLisbon() {
  fireEvent.click(await screen.findByRole('button', { name: /^Lisboa, Portugal/ }));
}

describe('App', () => {
  it('mostra marca, busca, unidade e estado idle inicialmente', () => {
    render(<App />);

    expect(screen.getByText('Weather')).toBeInTheDocument();
    expect(screen.getByRole('search', { name: 'Buscar cidade' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Unidade de temperatura' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Busque uma cidade');
    expect(screen.getByRole('button', { name: 'Celsius' })).toHaveAttribute('aria-pressed', 'true');
    expect(searchCitiesMock).not.toHaveBeenCalled();
    expect(getWeatherMock).not.toHaveBeenCalled();
  });

  it('transita por loading e mostra o clima e cinco dias retornados pelo service', async () => {
    render(<App />);
    submitCity('Lisboa');

    expect(screen.getByText('Buscando cidades...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Buscar' })).toBeDisabled();
    await screen.findByRole('list', { name: 'Resultados da busca' });
    expect(getWeatherMock).not.toHaveBeenCalled();
    await selectLisbon();
    expect(
      await screen.findByRole('heading', { name: 'Clima atual em Lisboa' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Previsão de cinco dias' })).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(5);
    expect(searchCitiesMock).toHaveBeenCalledWith('Lisboa', { signal: expect.any(AbortSignal) });
    expect(getWeatherMock).toHaveBeenCalledWith(weatherDataMock.city, {
      signal: expect.any(AbortSignal),
    });
    expect(screen.queryByText('Buscando o clima...')).not.toBeInTheDocument();
  });

  it('exibe empty quando a busca retorna zero cidades', async () => {
    searchCitiesMock.mockResolvedValue([]);
    render(<App />);
    submitCity('Porto');

    expect(
      await screen.findByRole('heading', { name: 'Nenhuma cidade encontrada' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(getWeatherMock).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Buscar' })).toBeEnabled();
  });

  it('troca a unidade dos componentes de apresentação sem consultar novamente', async () => {
    render(<App />);
    submitCity('Lisboa');
    await selectLisbon();
    await screen.findByRole('heading', { name: 'Clima atual em Lisboa' });

    expect(screen.getByText('18,4 °C')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Fahrenheit' }));
    expect(screen.getByText('65,1 °F')).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Previsão de cinco dias' })).toHaveTextContent('57,2');
    fireEvent.click(screen.getByRole('button', { name: 'Celsius' }));
    expect(screen.getByText('18,4 °C')).toBeInTheDocument();
    expect(searchCitiesMock).toHaveBeenCalledTimes(1);
    expect(getWeatherMock).toHaveBeenCalledTimes(1);
  });

  it.each([
    'search',
    'forecast',
  ])('exibe erro de %s e repete a consulta pelo retry', async (stage) => {
    const failedService = stage === 'search' ? searchCitiesMock : getWeatherMock;
    failedService.mockRejectedValueOnce(new WeatherServiceError('Falha de rede.'));
    render(<App />);
    submitCity('Lisboa');
    if (stage === 'forecast') await selectLisbon();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível consultar os dados do tempo. Tente novamente.',
    );
    expect(
      screen.queryByRole('heading', { name: 'Nenhuma cidade encontrada' }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    if (stage === 'search') await selectLisbon();

    expect(
      await screen.findByRole('heading', { name: 'Clima atual em Lisboa' }),
    ).toBeInTheDocument();
    expect(searchCitiesMock).toHaveBeenCalledTimes(stage === 'search' ? 2 : 1);
    expect(getWeatherMock).toHaveBeenCalledTimes(stage === 'search' ? 1 : 2);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('mostra timeout com mensagem específica sem expor detalhes internos', async () => {
    searchCitiesMock.mockRejectedValueOnce(
      new WeatherServiceError('AbortError interno', undefined, 'timeout'),
    );
    render(<App />);
    submitCity('Lisboa');
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'A consulta excedeu 10 segundos. Tente novamente.',
    );
    expect(screen.queryByText('AbortError interno')).not.toBeInTheDocument();
    expect(getWeatherMock).not.toHaveBeenCalled();
  });

  it('mantém dados e horário após atualização falha e recupera pelo retry', async () => {
    render(<App />);
    submitCity('Lisboa');
    await selectLisbon();
    await screen.findByRole('heading', { name: 'Clima atual em Lisboa' });
    const previousTimestamp = screen.getByText(/Última consulta bem-sucedida/).textContent;
    getWeatherMock.mockRejectedValueOnce(
      new WeatherServiceError('HTTP 503 do provedor', 503, 'api'),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Atualizar dados' }));
    expect(screen.getByRole('button', { name: 'Atualizar dados' })).toBeDisabled();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível consultar os dados do tempo. Tente novamente.',
    );
    expect(screen.getByText('Desatualizado')).toBeInTheDocument();
    expect(screen.getByText('18,4 °C')).toBeInTheDocument();
    expect(screen.getByText(/Última consulta bem-sucedida/).textContent).toBe(previousTimestamp);
    expect(screen.queryByText('HTTP 503 do provedor')).not.toBeInTheDocument();
    expect(getWeatherMock).toHaveBeenCalledTimes(2);

    getWeatherMock.mockResolvedValueOnce({
      ...weatherDataMock,
      lastSuccessfulQueryAt: '2026-11-05T13:00:00Z',
    });
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    await screen.findByText(/13:00:00/);
    expect(screen.queryByText('Desatualizado')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(searchCitiesMock).toHaveBeenCalledTimes(1);
  });

  it('desambigua cidades homônimas e permite selecionar o ID correto pelo teclado', async () => {
    const user = userEvent.setup();
    const cities = [3, 2, 1].map((providerId) => ({
      ...weatherDataMock.city,
      providerId,
      latitude: providerId,
    }));
    searchCitiesMock.mockResolvedValueOnce(cities);
    render(<App />);
    submitCity('Lisboa');

    const choices = await screen.findAllByRole('button', { name: /^Lisboa, Portugal/ });
    expect(choices).toHaveLength(2);
    expect(choices[0]).toHaveTextContent('(1, -9.1333)');
    expect(choices[1]).toHaveTextContent('(2, -9.1333)');
    choices[1].focus();
    await user.keyboard('{Enter}');
    await screen.findByRole('heading', { name: 'Clima atual em Lisboa' });
    expect(getWeatherMock).toHaveBeenCalledWith(cities[1], { signal: expect.any(AbortSignal) });
  });
});
