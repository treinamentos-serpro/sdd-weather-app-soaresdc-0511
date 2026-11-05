import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  fetchWithTimeout,
  getWeather,
  searchCities,
  WeatherServiceError,
} from '../../src/services/weatherService';
import type { City } from '../../src/types/weather';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const city: City = {
  providerId: 2267057,
  name: 'Lisboa',
  country: 'Portugal',
  latitude: 38.7167,
  longitude: -9.1333,
  timezone: 'Europe/Lisbon',
};

const dailyDates = ['2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08', '2026-11-09'];

function makeForecastPayload() {
  return {
    timezone: 'Europe/Lisbon',
    utc_offset_seconds: 0,
    current: {
      time: '2026-11-05T12:00',
      weather_code: 2,
      temperature_2m: 18.4,
      relative_humidity_2m: 67,
      wind_speed_10m: 12.6,
      wind_direction_10m: 240,
      wind_gusts_10m: 21.3,
      precipitation: 0.2,
      pressure_msl: 1014.2,
    },
    hourly: {
      time: dailyDates.map((date) => `${date}T12:00`),
      relative_humidity_2m: [68, 70, 72, 69, 65],
      wind_speed_10m: [12, 10, 13, 9, 11],
    },
    daily: {
      time: dailyDates,
      weather_code: [2, 61, 80, 0, 3],
      temperature_2m_min: [14, 13, 12, 13, 14],
      temperature_2m_max: [21, 19, 18, 20, 22],
      wind_direction_10m_dominant: [240, 225, 210, 235, 250],
      wind_gusts_10m_max: [21.3, 18.7, 24.5, 16.2, 19.1],
      precipitation_sum: [0.2, 1.2, 3.8, 0, 0.4],
      precipitation_probability_max: [30, 45, 65, 10, 25],
    },
  };
}

describe('searchCities', () => {
  it.each([
    null,
    { results: {} },
    { results: [{ id: 1 }] },
  ])('rejeita payload inválido: %j', async (payload) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => payload }));
    await expect(searchCities('Lisboa')).rejects.toMatchObject({ kind: 'invalid-response' });
  });

  it('normaliza JSON inválido como invalid-response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockRejectedValue(new SyntaxError('unexpected token')),
      }),
    );
    await expect(searchCities('Lisboa')).rejects.toMatchObject({ kind: 'invalid-response' });
  });

  it.each(['', '   ', '  \t\n '])('retorna vazio sem chamar fetch para input %j', async (input) => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(searchCities(input)).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([{}, { results: [] }])('retorna vazio quando não há results: %j', async (payload) => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(payload),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(searchCities('Lisboa')).resolves.toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('codifica o nome e mapeia resultados para City', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        results: [
          {
            id: 3448439,
            name: 'São Paulo',
            country: 'Brasil',
            admin1: 'São Paulo',
            latitude: -23.5475,
            longitude: -46.6361,
            timezone: 'America/Sao_Paulo',
          },
        ],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const cities = await searchCities(' São Paulo ');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://geocoding-api.open-meteo.com/v1/search?name=S%C3%A3o%20Paulo&count=100&language=pt&format=json',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(cities).toEqual([
      {
        providerId: 3448439,
        name: 'São Paulo',
        country: 'Brasil',
        region: 'São Paulo',
        latitude: -23.5475,
        longitude: -46.6361,
        timezone: 'America/Sao_Paulo',
      },
    ]);
  });

  it('lança WeatherServiceError quando a resposta HTTP não é ok', async () => {
    const json = vi.fn();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503, json }));

    const request = searchCities('Lisboa');
    await expect(request).rejects.toBeInstanceOf(WeatherServiceError);
    await expect(request).rejects.toMatchObject({ status: 503, kind: 'api' });
    expect(json).not.toHaveBeenCalled();
  });
});

describe('getWeather', () => {
  it('prioriza o fuso do forecast e mantém a data local quando a observação vira o dia em UTC', async () => {
    const payload = makeForecastPayload();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ...payload,
          timezone: 'America/New_York',
          utc_offset_seconds: -18_000,
          current: { ...payload.current, time: '2026-11-05T23:30' },
        }),
      }),
    );

    const result = await getWeather(city);
    expect(result.city.timezone).toBe('America/New_York');
    expect(result.current?.observedAt).toBe('2026-11-06T04:30:00.000Z');
    expect(result.forecast.map((day) => day.localDate)).toEqual(dailyDates);
  });

  it('usa o fuso do geocoding quando o forecast não o fornece', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ ...makeForecastPayload(), timezone: undefined }),
      }),
    );

    const result = await getWeather(city);
    expect(result.city.timezone).toBe('Europe/Lisbon');
    expect(result.forecast.map((day) => day.localDate)).toEqual(dailyDates);
  });

  it('agrega apenas amostras válidas por dia, sem tratar lacunas como zero', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ...makeForecastPayload(),
          hourly: {
            time: ['2026-11-05T00:00', '2026-11-05T01:00', '2026-11-05T02:00'],
            relative_humidity_2m: [0, null, 100],
            wind_speed_10m: [0, null, 20],
          },
        }),
      }),
    );

    const result = await getWeather(city);
    expect(result.forecast[0]).toMatchObject({
      relativeHumidityMeanPercent: 50,
      windMeanKmh: 10,
    });
    expect(result.forecast[1]).toMatchObject({
      relativeHumidityMeanPercent: null,
      windMeanKmh: null,
    });
  });

  it.each([
    429, 500, 503,
  ])('preserva a classificação e o status HTTP %s do forecast', async (status) => {
    const json = vi.fn();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status, json }));

    const request = getWeather(city);
    await expect(request).rejects.toBeInstanceOf(WeatherServiceError);
    await expect(request).rejects.toMatchObject({ kind: 'api', status });
    expect(json).not.toHaveBeenCalled();
  });

  it('classifica JSON inválido do forecast sem confundir com resposta vazia', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockRejectedValue(new SyntaxError('unexpected token')),
      }),
    );

    await expect(getWeather(city)).rejects.toMatchObject({
      name: 'WeatherServiceError',
      kind: 'invalid-response',
    });
  });

  it('classifica queda da conexão durante a leitura do corpo como falha de rede', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockRejectedValue(new TypeError('connection reset')),
      }),
    );

    await expect(getWeather(city)).rejects.toMatchObject({ kind: 'network' });
  });

  it('classifica rejeição do fetch no forecast como falha de rede', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));

    await expect(getWeather(city)).rejects.toMatchObject({ kind: 'network' });
  });

  it.each([
    null,
    undefined,
  ])('preserva campos atuais válidos quando outros são %s', async (missing) => {
    const payload = makeForecastPayload();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ...payload,
          current: {
            ...payload.current,
            temperature_2m: 0,
            relative_humidity_2m: missing,
            precipitation: missing,
            pressure_msl: missing,
          },
        }),
      }),
    );

    const result = await getWeather(city);
    expect(result.current).toMatchObject({
      temperatureC: 0,
      relativeHumidityPercent: null,
      precipitationLastHourMm: null,
      seaLevelPressureHpa: null,
      windSpeedKmh: 12.6,
    });
    expect(result.forecast).toHaveLength(5);
  });

  it('mantém campos e dias válidos quando há lacunas nos arrays diários', async () => {
    const payload = makeForecastPayload();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ...payload,
          daily: {
            ...payload.daily,
            temperature_2m_min: [null, 13, 12, 13, 14],
            weather_code: [null, 61, 80, 0, 3],
            precipitation_sum: [null, 1.2, 3.8, 0, 0.4],
            precipitation_probability_max: undefined,
          },
        }),
      }),
    );

    const result = await getWeather(city);
    expect(result.forecast).toHaveLength(5);
    expect(result.forecast[0]).toMatchObject({
      localDate: dailyDates[0],
      temperatureMinC: null,
      temperatureMaxC: 21,
      weatherCode: null,
      precipitationSumMm: null,
      precipitationProbabilityMaxPercent: null,
    });
    expect(result.forecast[1]).toMatchObject({
      localDate: dailyDates[1],
      temperatureMinC: 13,
      weatherCode: 61,
      precipitationSumMm: 1.2,
    });
    expect(result.forecast[3]?.precipitationSumMm).toBe(0);
    expect(result.current?.temperatureC).toBe(18.4);
  });

  it('mantém current e daily quando hourly não é fornecido', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ ...makeForecastPayload(), hourly: undefined }),
      }),
    );

    const result = await getWeather(city);
    expect(result.current?.relativeHumidityPercent).toBe(67);
    expect(result.forecast).toHaveLength(5);
    for (const day of result.forecast) {
      expect(day.relativeHumidityMeanPercent).toBeNull();
      expect(day.windMeanKmh).toBeNull();
    }
    expect(result.forecast[0]?.temperatureMaxC).toBe(21);
  });

  it.each([
    { dates: [] },
    { dates: dailyDates.slice(0, 4) },
    { dates: [...dailyDates, '2026-11-10'] },
  ])('rejeita uma quantidade inválida de datas: $dates', async ({ dates }) => {
    const payload = makeForecastPayload();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ ...payload, daily: { ...payload.daily, time: dates } }),
      }),
    );

    await expect(getWeather(city)).rejects.toMatchObject({ kind: 'invalid-response' });
  });

  it('trata metadados e séries horários nulos como ausentes', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ...makeForecastPayload(),
          utc_offset_seconds: null,
          hourly: { time: null, relative_humidity_2m: null },
        }),
      }),
    );
    const result = await getWeather(city);
    expect(result.current?.observedAt).toBeNull();
    expect(result.forecast[0]?.relativeHumidityMeanPercent).toBeNull();
  });

  it('rejeita valores incompatíveis em vez de propagá-los à UI', async () => {
    const payload = makeForecastPayload();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ ...payload, current: { temperature_2m: 'quente' } }),
      }),
    );
    await expect(getWeather(city)).rejects.toMatchObject({ kind: 'invalid-response' });
  });

  it('mantém o clima atual sem inventar previsão quando ambos os fusos faltam', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ ...makeForecastPayload(), timezone: undefined }),
      }),
    );
    const result = await getWeather({ ...city, timezone: null });
    expect(result.forecast).toEqual([]);
    expect(result.current?.temperatureC).toBe(18.4);
  });

  it('mapeia current e arrays paralelos de daily para cinco ForecastDay', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(makeForecastPayload()),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await getWeather(city);
    const requestUrl = String(fetchMock.mock.calls[0]?.[0]);
    const request = new URL(requestUrl);

    expect(request.origin + request.pathname).toBe('https://api.open-meteo.com/v1/forecast');
    expect(request.searchParams.get('current')).toContain('pressure_msl');
    expect(request.searchParams.get('daily')).toContain('temperature_2m_min');
    expect(request.searchParams.get('daily')).toContain('temperature_2m_max');
    expect(request.searchParams.get('timezone')).toBe('auto');
    expect(result.city.timezone).toBe('Europe/Lisbon');
    expect(result.current).toMatchObject({
      weatherCode: 2,
      temperatureC: 18.4,
      relativeHumidityPercent: 67,
      windSpeedKmh: 12.6,
      windDirectionDegrees: 240,
      windGustKmh: 21.3,
      precipitationLastHourMm: 0.2,
      seaLevelPressureHpa: 1014.2,
      observedAt: '2026-11-05T12:00:00.000Z',
    });
    expect(result.forecast).toHaveLength(5);
    expect(result.forecast).toEqual(
      dailyDates.map((localDate, index) => ({
        localDate,
        weatherCode: [2, 61, 80, 0, 3][index],
        temperatureMinC: [14, 13, 12, 13, 14][index],
        temperatureMaxC: [21, 19, 18, 20, 22][index],
        relativeHumidityMeanPercent: [68, 70, 72, 69, 65][index],
        windMeanKmh: [12, 10, 13, 9, 11][index],
        windDirectionDominantDegrees: [240, 225, 210, 235, 250][index],
        windGustMaxKmh: [21.3, 18.7, 24.5, 16.2, 19.1][index],
        precipitationSumMm: [0.2, 1.2, 3.8, 0, 0.4][index],
        precipitationProbabilityMaxPercent: [30, 45, 65, 10, 25][index],
      })),
    );
  });

  it.fails('converte precipitação atual null em zero (diverge da implementação e da spec atuais)', async () => {
    const payload = makeForecastPayload();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ ...payload, current: { ...payload.current, precipitation: null } }),
      }),
    );

    const result = await getWeather(city);
    expect(result.current?.precipitationLastHourMm).toBe(0);
  });

  it.fails('converte precipitação diária null em zero (diverge da implementação e da spec atuais)', async () => {
    const payload = makeForecastPayload();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ...payload,
          daily: { ...payload.daily, precipitation_sum: [null, 1.2, 3.8, 0, 0.4] },
        }),
      }),
    );

    const result = await getWeather(city);
    expect(result.forecast[0]?.precipitationSumMm).toBe(0);
  });

  it.each([
    ['current', undefined],
    ['current', null],
    ['daily', undefined],
    ['daily', null],
  ] as const)('lança WeatherServiceError se %s for %s', async (field, value) => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ ...makeForecastPayload(), [field]: value }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const request = getWeather(city);
    await expect(request).rejects.toBeInstanceOf(WeatherServiceError);
    await expect(request).rejects.toMatchObject({ kind: 'invalid-response' });
  });
});

describe('fetchWithTimeout', () => {
  it('ignora corpo concluído após o prazo mesmo se o callback do timer atrasar', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => {
          vi.setSystemTime(Date.now() + 10_001);
          return { results: [] };
        },
      }),
    );
    await expect(searchCities('Lisboa')).rejects.toMatchObject({ kind: 'timeout' });
    expect(vi.getTimerCount()).toBe(0);
  });

  it('inclui o corpo no prazo total e rejeita mesmo se ele ignorar o cancelamento', async () => {
    vi.useFakeTimers();
    let finishBody: (value: unknown) => void = () => {};
    const body = new Promise<unknown>((resolve) => {
      finishBody = resolve;
    });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 6_000));
        return { ok: true, json: () => body };
      }),
    );
    const request = searchCities('Lisboa');
    const rejection = expect(request).rejects.toMatchObject({ kind: 'timeout' });
    await vi.advanceTimersByTimeAsync(9_999);
    expect(vi.getTimerCount()).toBe(1);
    await vi.advanceTimersByTimeAsync(1);
    await rejection;
    finishBody({ results: [] });
    await Promise.resolve();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('respeita o sinal externo e não aguarda fetch que ignora abort', async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})));
    const request = getWeather(city, { signal: controller.signal });
    const rejection = expect(request).rejects.toMatchObject({ kind: 'timeout' });
    controller.abort();
    await rejection;
    expect(vi.getTimerCount()).toBe(0);
  });

  it('converte AbortError para a mensagem de timeout e limpa o timer', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn(
      (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener(
            'abort',
            () => reject(new DOMException('Aborted', 'AbortError')),
            { once: true },
          );
        }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const request = fetchWithTimeout('https://example.test/data');
    const rejection = expect(request).rejects.toThrow('A requisição demorou demais.');
    await vi.advanceTimersByTimeAsync(10_000);
    await rejection;

    expect(vi.getTimerCount()).toBe(0);
  });

  it('converte falha de rede para a mensagem definida e limpa o timer', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));

    await expect(fetchWithTimeout('https://example.test/data')).rejects.toThrow('Falha de rede.');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('limpa o timer quando a requisição tem sucesso', async () => {
    vi.useFakeTimers();
    const response = { ok: true } as Response;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));

    await expect(fetchWithTimeout('https://example.test/data')).resolves.toBe(response);
    expect(vi.getTimerCount()).toBe(0);
  });
});
