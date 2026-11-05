import { describe, expect, it } from 'vitest';
import { formatForecastDayLabel } from '../../src/lib/format';

describe('formatForecastDayLabel', () => {
  it.each([
    ['2026-11-05', 'quinta-feira, 5 de nov.'],
    ['2026-11-06', 'sexta-feira, 6 de nov.'],
    ['2026-11-07', 'sábado, 7 de nov.'],
    ['2026-11-08', 'domingo, 8 de nov.'],
    ['2026-12-31', 'quinta-feira, 31 de dez.'],
    ['2027-01-01', 'sexta-feira, 1 de jan.'],
  ])('formata a data local %s em pt-BR sem depender do relógio atual', (localDate, expected) => {
    expect(formatForecastDayLabel(localDate)).toBe(expected);
  });

  it.each([
    'data-inválida',
    '',
    '2026-13-05',
  ])('preserva entrada inválida %j sem lançar erro', (localDate) => {
    expect(formatForecastDayLabel(localDate)).toBe(localDate);
  });

  it.todo('retorna "Hoje" para índice 0 (a API atual não recebe índice)');
  it.todo('retorna "Amanhã" para índice 1 (a API atual não recebe índice)');
  it.todo('retorna o dia da semana para os demais índices (a API atual não recebe índice)');
});

describe('getShortDate (export ainda inexistente)', () => {
  it.todo('formata uma data válida como data curta');
});
