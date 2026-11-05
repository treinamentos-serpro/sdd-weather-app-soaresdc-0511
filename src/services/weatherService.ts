import { averageForLocalDate } from '../lib/dailyAggregation';
import type { City, CurrentWeather, ForecastDay, WeatherData } from '../types/weather';

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const REQUEST_TIMEOUT_MS = 10_000;

interface GeocodingResult {
  id: number;
  name: string;
  country: string;
  admin1?: string | null;
  latitude: number;
  longitude: number;
  timezone?: string | null;
}

interface GeocodingResponse {
  results?: GeocodingResult[];
}

type NullableNumberSeries = Array<number | null>;

interface ForecastCurrentResponse {
  time?: string | null;
  weather_code?: number | null;
  temperature_2m?: number | null;
  relative_humidity_2m?: number | null;
  wind_speed_10m?: number | null;
  wind_direction_10m?: number | null;
  wind_gusts_10m?: number | null;
  precipitation?: number | null;
  pressure_msl?: number | null;
}

interface ForecastHourlyResponse {
  time?: string[] | null;
  relative_humidity_2m?: NullableNumberSeries | null;
  wind_speed_10m?: NullableNumberSeries | null;
}

interface ForecastDailyResponse {
  time?: string[];
  weather_code?: NullableNumberSeries;
  temperature_2m_min?: NullableNumberSeries;
  temperature_2m_max?: NullableNumberSeries;
  wind_direction_10m_dominant?: NullableNumberSeries;
  wind_gusts_10m_max?: NullableNumberSeries;
  precipitation_sum?: NullableNumberSeries;
  precipitation_probability_max?: NullableNumberSeries;
}

interface ForecastResponse {
  timezone?: string | null;
  utc_offset_seconds?: number | null;
  current?: ForecastCurrentResponse | null;
  hourly?: ForecastHourlyResponse | null;
  daily?: ForecastDailyResponse | null;
}

export type WeatherErrorKind = 'network' | 'api' | 'timeout' | 'invalid-response';

export class WeatherServiceError extends Error {
  readonly status?: number;
  readonly kind: WeatherErrorKind;

  constructor(message: string, status?: number, kind: WeatherErrorKind = 'network') {
    super(message);
    this.name = 'WeatherServiceError';
    this.status = status;
    this.kind = kind;
  }
}

export function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
export function fetchWithTimeout<Result>(
  input: RequestInfo | URL,
  init: RequestInit,
  readResponse: (response: Response) => Promise<Result>,
): Promise<Result>;
export async function fetchWithTimeout<Result>(
  input: RequestInfo | URL,
  init: RequestInit = {},
  readResponse?: (response: Response) => Promise<Result>,
): Promise<Response | Result> {
  const controller = new AbortController();
  const deadline = Date.now() + REQUEST_TIMEOUT_MS;
  let rejectAbort: (error: WeatherServiceError) => void = () => {};
  const aborted = new Promise<never>((_resolve, reject) => {
    rejectAbort = reject;
  });
  const abort = () => {
    controller.abort();
    rejectAbort(new WeatherServiceError('A requisição demorou demais.', undefined, 'timeout'));
  };
  const timeoutId = setTimeout(abort, REQUEST_TIMEOUT_MS);
  init.signal?.addEventListener('abort', abort, { once: true });
  if (init.signal?.aborted) abort();

  try {
    return await Promise.race([
      aborted,
      (async () => {
        if (controller.signal.aborted) return await aborted;
        const response = await fetch(input, { ...init, signal: controller.signal });
        if (controller.signal.aborted) return await aborted;
        const result = readResponse ? await readResponse(response) : response;
        if (Date.now() >= deadline) abort();
        if (controller.signal.aborted) return await aborted;
        return result;
      })(),
    ]);
  } catch (error) {
    if (error instanceof WeatherServiceError) throw error;
    if (controller.signal.aborted || (error instanceof Error && error.name === 'AbortError')) {
      throw new WeatherServiceError('A requisição demorou demais.', undefined, 'timeout');
    }
    throw new WeatherServiceError('Falha de rede.', undefined, 'network');
  } finally {
    clearTimeout(timeoutId);
    init.signal?.removeEventListener('abort', abort);
  }
}

function invalidResponse(): never {
  throw new WeatherServiceError('Resposta inválida do Open-Meteo.', undefined, 'invalid-response');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function optionalNumber(value: unknown): boolean {
  return value == null || (typeof value === 'number' && Number.isFinite(value));
}

function optionalString(value: unknown): boolean {
  return value == null || typeof value === 'string';
}

function validTimezone(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value !== 'string' || !value) return false;
  try {
    new Intl.DateTimeFormat('pt-BR', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

async function readJson(response: Response): Promise<unknown> {
  if (!response.ok) {
    throw new WeatherServiceError('Falha HTTP do Open-Meteo.', response.status, 'api');
  }
  try {
    return await response.json();
  } catch (error) {
    if (error instanceof SyntaxError) invalidResponse();
    throw error;
  }
}

function validateGeocoding(payload: unknown): asserts payload is GeocodingResponse {
  if (!isRecord(payload)) invalidResponse();
  if (payload.results === undefined) return;
  if (!Array.isArray(payload.results)) invalidResponse();
  for (const result of payload.results) {
    if (
      !isRecord(result) ||
      !Number.isSafeInteger(result.id) ||
      typeof result.name !== 'string' ||
      !result.name.trim() ||
      typeof result.country !== 'string' ||
      !result.country.trim() ||
      typeof result.latitude !== 'number' ||
      !Number.isFinite(result.latitude) ||
      Math.abs(result.latitude) > 90 ||
      typeof result.longitude !== 'number' ||
      !Number.isFinite(result.longitude) ||
      Math.abs(result.longitude) > 180 ||
      !optionalString(result.admin1) ||
      !validTimezone(result.timezone)
    )
      invalidResponse();
  }
}

function validateForecast(payload: unknown): asserts payload is ForecastResponse {
  if (!isRecord(payload) || !isRecord(payload.current) || !isRecord(payload.daily))
    invalidResponse();
  if (!validTimezone(payload.timezone) || !optionalNumber(payload.utc_offset_seconds))
    invalidResponse();
  const current = payload.current;
  if (!optionalString(current.time)) invalidResponse();
  for (const key of [
    'weather_code',
    'temperature_2m',
    'relative_humidity_2m',
    'wind_speed_10m',
    'wind_direction_10m',
    'wind_gusts_10m',
    'precipitation',
    'pressure_msl',
  ]) {
    if (!optionalNumber(current[key])) invalidResponse();
  }
  const daily = payload.daily;
  if (
    !Array.isArray(daily.time) ||
    daily.time.length !== 5 ||
    !daily.time.every((date) => typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date))
  )
    invalidResponse();
  for (const key of [
    'weather_code',
    'temperature_2m_min',
    'temperature_2m_max',
    'wind_direction_10m_dominant',
    'wind_gusts_10m_max',
    'precipitation_sum',
    'precipitation_probability_max',
  ]) {
    const values = daily[key];
    if (
      values != null &&
      (!Array.isArray(values) || values.length !== 5 || !values.every(optionalNumber))
    )
      invalidResponse();
  }
  if (payload.hourly != null) {
    if (!isRecord(payload.hourly)) invalidResponse();
    const hourly = payload.hourly;
    if (
      hourly.time != null &&
      (!Array.isArray(hourly.time) || !hourly.time.every((time) => typeof time === 'string'))
    )
      invalidResponse();
    for (const key of ['relative_humidity_2m', 'wind_speed_10m']) {
      const values = hourly[key];
      if (values != null && (!Array.isArray(values) || !values.every(optionalNumber)))
        invalidResponse();
    }
  }
}

function valueAt(values: NullableNumberSeries | undefined, index: number): number | null {
  const value = values?.[index];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function observedAtUtc(
  localTime: string | null | undefined,
  utcOffsetSeconds: number | null | undefined,
): string | null {
  if (!localTime || utcOffsetSeconds == null) return null;

  const localClockAsUtc = Date.parse(`${localTime}Z`);
  if (!Number.isFinite(localClockAsUtc)) return null;

  return new Date(localClockAsUtc - utcOffsetSeconds * 1_000).toISOString();
}

export async function searchCities(name: string, init: RequestInit = {}): Promise<City[]> {
  const normalizedName = name.trim();
  if (!normalizedName) return [];

  const url = `${GEOCODING_URL}?name=${encodeURIComponent(normalizedName)}&count=100&language=pt&format=json`;
  const payload = await fetchWithTimeout(url, init, readJson);
  validateGeocoding(payload);

  return (payload.results ?? []).map((result) => ({
    providerId: result.id,
    name: result.name,
    country: result.country,
    region: result.admin1 ?? undefined,
    latitude: result.latitude,
    longitude: result.longitude,
    timezone: result.timezone ?? null,
  }));
}

export async function getWeather(city: City, init: RequestInit = {}): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    current:
      'weather_code,temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,precipitation,pressure_msl',
    hourly: 'relative_humidity_2m,wind_speed_10m',
    daily:
      'weather_code,temperature_2m_min,temperature_2m_max,wind_direction_10m_dominant,wind_gusts_10m_max,precipitation_sum,precipitation_probability_max',
    forecast_days: '5',
    timezone: 'auto',
    temperature_unit: 'celsius',
    wind_speed_unit: 'kmh',
    precipitation_unit: 'mm',
    pressure_unit: 'hPa',
  });
  const payload = await fetchWithTimeout(`${FORECAST_URL}?${params.toString()}`, init, readJson);
  validateForecast(payload);
  const daily = payload.daily;
  const currentResponse = payload.current;
  if (!daily?.time || !currentResponse) invalidResponse();
  const dailyDates = daily.time;

  const timezone = payload.timezone ?? city.timezone;
  const current: CurrentWeather = {
    weatherCode: currentResponse.weather_code ?? null,
    temperatureC: currentResponse.temperature_2m ?? null,
    relativeHumidityPercent: currentResponse.relative_humidity_2m ?? null,
    windSpeedKmh: currentResponse.wind_speed_10m ?? null,
    windDirectionDegrees: currentResponse.wind_direction_10m ?? null,
    windGustKmh: currentResponse.wind_gusts_10m ?? null,
    precipitationLastHourMm: currentResponse.precipitation ?? null,
    seaLevelPressureHpa: currentResponse.pressure_msl ?? null,
    observedAt: observedAtUtc(currentResponse.time, payload.utc_offset_seconds),
  };

  const forecast: ForecastDay[] = dailyDates.map((localDate, index) => ({
    localDate,
    weatherCode: valueAt(daily.weather_code, index),
    temperatureMinC: valueAt(daily.temperature_2m_min, index),
    temperatureMaxC: valueAt(daily.temperature_2m_max, index),
    relativeHumidityMeanPercent: averageForLocalDate(
      payload.hourly?.time ?? undefined,
      payload.hourly?.relative_humidity_2m ?? undefined,
      localDate,
    ),
    windMeanKmh: averageForLocalDate(
      payload.hourly?.time ?? undefined,
      payload.hourly?.wind_speed_10m ?? undefined,
      localDate,
    ),
    windDirectionDominantDegrees: valueAt(daily.wind_direction_10m_dominant, index),
    windGustMaxKmh: valueAt(daily.wind_gusts_10m_max, index),
    precipitationSumMm: valueAt(daily.precipitation_sum, index),
    precipitationProbabilityMaxPercent: valueAt(daily.precipitation_probability_max, index),
  }));

  return {
    city: { ...city, timezone },
    current,
    forecast: timezone ? forecast : [],
    lastSuccessfulQueryAt: new Date().toISOString(),
  };
}
