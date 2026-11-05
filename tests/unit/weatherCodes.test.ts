import { describe, expect, it } from 'vitest';
import { getWeatherCodeInfo } from '../../src/lib/weatherCodes';

describe('getWeatherCodeInfo', () => {
  it.each([
    [0, '☀️', 'Céu limpo'],
    [2, '⛅', 'Parcialmente nublado'],
    [45, '🌫️', 'Nevoeiro'],
    [48, '🌫️', 'Nevoeiro'],
    [51, '🌧️', 'Garoa'],
    [61, '🌧️', 'Chuva'],
    [71, '❄️', 'Neve'],
    [80, '🌦️', 'Pancadas de chuva'],
    [85, '🌨️', 'Pancadas de neve'],
    [95, '⛈️', 'Trovoadas'],
  ] as const)('retorna ícone e descrição para o código conhecido %s', (code, icon, description) => {
    expect(getWeatherCodeInfo(code)).toEqual({ icon, description });
  });

  it.each([-1, 42, 999])('retorna fallback para o código desconhecido %s', (code) => {
    expect(getWeatherCodeInfo(code)).toEqual({
      icon: '·',
      description: 'Condição indisponível',
    });
  });

  it('retorna fallback quando o código está ausente', () => {
    expect(getWeatherCodeInfo(null)).toEqual({
      icon: '·',
      description: 'Condição indisponível',
    });
  });
});
