import { describe, expect, it } from 'vitest';
import { formatTemperature } from '../../src/lib/temperature';

describe('formatTemperature', () => {
  it.each([
    [0, '32,0 °F'],
    [100, '212,0 °F'],
    [-40, '-40,0 °F'],
  ])('converte %s °C para %s', (temperatureC, expected) => {
    expect(formatTemperature(temperatureC, 'fahrenheit')).toBe(expected);
  });

  it.each([
    [20, 'celsius', '20,0 °C'],
    [20, 'fahrenheit', '68,0 °F'],
    [-40, 'celsius', '-40,0 °C'],
  ] as const)('formata %s °C na unidade %s com símbolo e uma casa decimal', (temperatureC, unit, expected) => {
    expect(formatTemperature(temperatureC, unit)).toBe(expected);
  });

  it.each([
    [18.44, 'celsius', '18,4 °C'],
    [18.46, 'celsius', '18,5 °C'],
    [20.25, 'celsius', '20,3 °C'],
    [-20.25, 'celsius', '-20,3 °C'],
    [-20.25, 'fahrenheit', '-4,5 °F'],
    [18.4, 'fahrenheit', '65,1 °F'],
    [20.24, 'celsius', '20,2 °C'],
    [-20.24, 'celsius', '-20,2 °C'],
    [1.25, 'fahrenheit', '34,3 °F'],
    [-18.25, 'fahrenheit', '-0,9 °F'],
  ] as const)('arredonda %s °C em %s para %s', (temperatureC, unit, expected) => {
    expect(formatTemperature(temperatureC, unit)).toBe(expected);
  });

  it.each([
    'celsius',
    'fahrenheit',
  ] as const)('indica temperatura ausente em %s sem inventar valor', (unit) => {
    expect(formatTemperature(null, unit)).toBe('Indisponível');
  });
});

describe('convertTemperature (export ainda inexistente)', () => {
  it.todo('retorna a temperatura original quando a unidade é celsius');
  it.todo('converte a temperatura-base em Celsius quando a unidade é fahrenheit');
});

describe('unitLabel (export ainda inexistente)', () => {
  it.todo('retorna °C para celsius');
  it.todo('retorna °F para fahrenheit');
});
