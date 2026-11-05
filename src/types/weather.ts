export type Unit = "celsius" | "fahrenheit";

export interface City {
  providerId: number; // ID da localidade retornado pelo geocoding.
  name: string; // Nome da cidade.
  country: string; // País da localidade.
  region?: string; // Estado ou região, quando disponível.
  latitude: number; // Latitude usada para consultar o forecast.
  longitude: number; // Longitude usada para consultar o forecast.
  timezone: string | null; // Fuso IANA, ou null se indisponível.
}

export interface CurrentWeather {
  weatherCode: number | null; // Código WMO da condição atual.
  temperatureC: number | null; // Temperatura instantânea em Celsius.
  relativeHumidityPercent: number | null; // Umidade relativa instantânea em porcentagem.
  windSpeedKmh: number | null; // Velocidade instantânea do vento em km/h.
  windDirectionDegrees: number | null; // Direção instantânea do vento em graus.
  windGustKmh: number | null; // Rajada atual em km/h.
  precipitationLastHourMm: number | null; // Precipitação na última hora em mm.
  seaLevelPressureHpa: number | null; // Pressão atmosférica reduzida ao nível do mar em hPa.
  observedAt: string | null; // Instante da observação em ISO 8601 UTC.
}

export interface ForecastDay {
  localDate: string; // Data local no formato YYYY-MM-DD.
  weatherCode: number | null; // Código WMO da condição meteorológica.
  temperatureMinC: number | null; // Temperatura mínima diária em Celsius.
  temperatureMaxC: number | null; // Temperatura máxima diária em Celsius.
  relativeHumidityMeanPercent: number | null; // Umidade média diária em porcentagem.
  windMeanKmh: number | null; // Velocidade média diária do vento em km/h.
  windDirectionDominantDegrees: number | null; // Direção predominante do vento em graus.
  windGustMaxKmh: number | null; // Rajada máxima do dia em km/h.
  precipitationSumMm: number | null; // Precipitação acumulada no dia em mm.
  precipitationProbabilityMaxPercent: number | null; // Probabilidade máxima diária em porcentagem.
}

export interface WeatherData {
  city: City; // Cidade associada aos dados.
  current: CurrentWeather | null; // Condições atuais, ou null se indisponíveis.
  forecast: ForecastDay[]; // Dias previstos no fuso local da cidade.
  lastSuccessfulQueryAt: string; // Conclusão da última consulta válida em ISO 8601 UTC.
}