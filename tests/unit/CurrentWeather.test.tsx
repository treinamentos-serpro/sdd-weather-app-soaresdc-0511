import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import CurrentWeather from '../../src/components/CurrentWeather';
import { weatherDataMock } from '../../src/mocks/weatherData';

describe('CurrentWeather', () => {
  it('mostra campos parciais como indisponíveis e mantém vento e condição válidos', () => {
    render(
      <CurrentWeather
        city={weatherDataMock.city}
        current={
          weatherDataMock.current
            ? {
                ...weatherDataMock.current,
                temperatureC: null,
                relativeHumidityPercent: null,
                precipitationLastHourMm: null,
                seaLevelPressureHpa: null,
              }
            : null
        }
        unit="fahrenheit"
      />,
    );

    expect(screen.getAllByText('Indisponível')).toHaveLength(4);
    expect(screen.getByText('12,6 km/h')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Parcialmente nublado' })).toBeInTheDocument();
    expect(screen.queryByText('32,0 °F')).not.toBeInTheDocument();
    expect(screen.queryByText('0 mm')).not.toBeInTheDocument();
  });

  it('preserva valores zero sem classificá-los como dados ausentes', () => {
    render(
      <CurrentWeather
        city={weatherDataMock.city}
        current={
          weatherDataMock.current
            ? {
                ...weatherDataMock.current,
                temperatureC: 0,
                relativeHumidityPercent: 0,
                windSpeedKmh: 0,
                windDirectionDegrees: 0,
                windGustKmh: 0,
                precipitationLastHourMm: 0,
              }
            : null
        }
        unit="celsius"
      />,
    );

    for (const value of ['0,0 °C', '0 %', '0 km/h', '0 mm']) {
      expect(screen.getByText(value)).toBeInTheDocument();
    }
    expect(screen.getByText('direção 0° · rajadas 0 km/h')).toBeInTheDocument();
    expect(screen.queryByText('Indisponível')).not.toBeInTheDocument();
  });

  it('expõe heading, condição e métricas com nomes acessíveis', () => {
    render(
      <CurrentWeather
        city={weatherDataMock.city}
        current={weatherDataMock.current}
        unit="celsius"
      />,
    );

    expect(
      screen.getByRole('heading', { level: 2, name: 'Clima atual em Lisboa' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Parcialmente nublado' })).toBeInTheDocument();
    expect(screen.getByText('18,4 °C')).toBeInTheDocument();
    expect(screen.getByText('Umidade')).toBeInTheDocument();
    expect(screen.getByText('Vento')).toBeInTheDocument();
    expect(screen.getByText('Precipitação')).toBeInTheDocument();
    expect(screen.getByText('Pressão ao nível do mar')).toBeInTheDocument();
  });

  it('mantém os rótulos e indica métricas indisponíveis sem dados atuais', () => {
    render(<CurrentWeather city={weatherDataMock.city} current={null} unit="fahrenheit" />);

    expect(screen.getByRole('img', { name: 'Condição indisponível' })).toBeInTheDocument();
    expect(screen.getAllByText('Indisponível')).toHaveLength(5);
  });
});
