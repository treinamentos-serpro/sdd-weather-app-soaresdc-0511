import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ForecastCard from '../../src/components/ForecastCard';
import ForecastList from '../../src/components/ForecastList';
import { weatherDataMock } from '../../src/mocks/weatherData';

const firstForecastDay = weatherDataMock.forecast[0];

if (!firstForecastDay) {
  throw new Error('O mock precisa conter pelo menos um dia de previsão.');
}

describe('ForecastCard', () => {
  it('mantém a máxima válida quando mínima e probabilidade estão ausentes', () => {
    render(
      <ForecastCard
        day={{
          ...firstForecastDay,
          temperatureMinC: null,
          precipitationProbabilityMaxPercent: null,
        }}
        unit="fahrenheit"
      />,
    );

    expect(screen.getByRole('heading', { name: /quinta-feira/i })).toBeInTheDocument();
    expect(screen.getByText('69,8 °F')).toBeInTheDocument();
    expect(screen.getAllByText('Indisponível')).toHaveLength(2);
    expect(screen.queryByText('32,0 °F')).not.toBeInTheDocument();
    expect(screen.queryByText('0%')).not.toBeInTheDocument();
  });

  it('exibe dia, condição, máximas/mínimas convertidas e probabilidade de chuva', () => {
    render(<ForecastCard day={firstForecastDay} unit="fahrenheit" />);

    expect(screen.getByRole('heading', { name: /quinta-feira/i })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Parcialmente nublado' })).toBeInTheDocument();
    expect(screen.getByText('69,8 °F')).toBeInTheDocument();
    expect(screen.getByText('57,2 °F')).toBeInTheDocument();
    expect(screen.getByText('30%')).toBeInTheDocument();
  });

  it('marca como indisponíveis os campos opcionais ausentes', () => {
    render(
      <ForecastCard
        day={{
          ...firstForecastDay,
          weatherCode: null,
          temperatureMaxC: null,
          temperatureMinC: null,
          precipitationProbabilityMaxPercent: null,
        }}
        unit="celsius"
      />,
    );

    expect(screen.getByRole('img', { name: 'Condição indisponível' })).toBeInTheDocument();
    expect(screen.getAllByText('Indisponível')).toHaveLength(3);
  });
});

describe('ForecastList', () => {
  it('renderiza cinco cards em uma lista acessível', () => {
    render(<ForecastList forecast={weatherDataMock.forecast} unit="celsius" />);

    expect(screen.getByRole('list', { name: 'Previsão de cinco dias' })).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(5);
  });

  it('apresenta estado vazio sem cards', () => {
    render(<ForecastList forecast={[]} unit="celsius" />);

    expect(screen.getByRole('status')).toHaveTextContent('Previsão indisponível.');
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });
});
