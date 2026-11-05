import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import CurrentWeather from '../../src/components/CurrentWeather';
import UnitToggle from '../../src/components/UnitToggle';
import { weatherDataMock } from '../../src/mocks/weatherData';
import type { Unit } from '../../src/types/weather';

function WeatherWithUnitToggle({ temperatureC = 0 }: { temperatureC?: number }) {
  const [unit, setUnit] = useState<Unit>('celsius');

  return (
    <>
      <UnitToggle unit={unit} onChange={setUnit} />
      <CurrentWeather
        city={weatherDataMock.city}
        current={weatherDataMock.current ? { ...weatherDataMock.current, temperatureC } : null}
        unit={unit}
      />
    </>
  );
}

describe('UnitToggle com CurrentWeather', () => {
  it('não acumula arredondamento nem altera outras métricas ao alternar uma temperatura negativa', async () => {
    const user = userEvent.setup();
    render(<WeatherWithUnitToggle temperatureC={-20.25} />);
    const toggle = within(screen.getByRole('group', { name: 'Unidade de temperatura' }));
    const weather = within(screen.getByRole('region', { name: 'Clima atual em Lisboa' }));

    expect(weather.getByText('-20,3 °C')).toBeInTheDocument();
    for (let cycle = 0; cycle < 3; cycle += 1) {
      await user.click(toggle.getByRole('button', { name: 'Fahrenheit' }));
      expect(weather.getByText('-4,5 °F')).toBeInTheDocument();
      for (const metric of ['67 %', '12,6 km/h', '0,2 mm', '1.014,2 hPa']) {
        expect(weather.getByText(metric)).toBeInTheDocument();
      }
      await user.click(toggle.getByRole('button', { name: 'Celsius' }));
      expect(weather.getByText('-20,3 °C')).toBeInTheDocument();
    }
  });

  it('converte 0 °C em 32 °F ao selecionar Fahrenheit', async () => {
    const user = userEvent.setup();
    render(<WeatherWithUnitToggle />);
    const toggle = within(screen.getByRole('group', { name: 'Unidade de temperatura' }));
    const weather = within(screen.getByRole('region', { name: 'Clima atual em Lisboa' }));

    expect(weather.getByText('0,0 °C')).toBeInTheDocument();
    expect(toggle.getByRole('button', { name: 'Celsius' })).toHaveAttribute('aria-pressed', 'true');

    await user.click(toggle.getByRole('button', { name: 'Fahrenheit' }));

    expect(weather.getByText('32,0 °F')).toBeInTheDocument();
    expect(weather.queryByText('0,0 °C')).not.toBeInTheDocument();
    expect(toggle.getByRole('button', { name: 'Fahrenheit' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(toggle.getByRole('button', { name: 'Celsius' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('retorna a 0 °C ao selecionar Celsius novamente', async () => {
    const user = userEvent.setup();
    render(<WeatherWithUnitToggle />);
    const toggle = within(screen.getByRole('group', { name: 'Unidade de temperatura' }));
    const weather = within(screen.getByRole('region', { name: 'Clima atual em Lisboa' }));

    await user.click(toggle.getByRole('button', { name: 'Fahrenheit' }));
    await user.click(toggle.getByRole('button', { name: 'Celsius' }));

    expect(weather.getByText('0,0 °C')).toBeInTheDocument();
    expect(weather.queryByText('32,0 °F')).not.toBeInTheDocument();
    expect(toggle.getByRole('button', { name: 'Celsius' })).toHaveAttribute('aria-pressed', 'true');
  });
});
