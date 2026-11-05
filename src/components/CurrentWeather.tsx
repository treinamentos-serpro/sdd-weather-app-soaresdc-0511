import type { City, CurrentWeather as CurrentWeatherData, Unit } from "../types/weather";
import { formatTemperature } from "../lib/temperature";
import { getWeatherCodeInfo } from "../lib/weatherCodes";

interface CurrentWeatherProps {
  city: City;
  current: CurrentWeatherData | null;
  unit: Unit;
}

function formatMetric(value: number | null, unit: string): string {
  if (value === null) return "Indisponível";

  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(value)} ${unit}`;
}

export default function CurrentWeather({ city, current, unit }: CurrentWeatherProps) {
  const condition = getWeatherCodeInfo(current?.weatherCode ?? null);
  const wind = current
    ? formatMetric(current.windSpeedKmh, "km/h")
    : "Indisponível";
  const windDetails = current
    ? [
        current.windDirectionDegrees === null
          ? null
          : `direção ${current.windDirectionDegrees}°`,
        current.windGustKmh === null
          ? null
          : `rajadas ${formatMetric(current.windGustKmh, "km/h")}`,
      ]
        .filter(Boolean)
        .join(" · ")
    : "";

  return (
    <section
      aria-labelledby="current-weather-title"
      className="rounded-xl border border-white/10 bg-white/5 p-5 shadow-glass backdrop-blur-md sm:p-7"
    >
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-accent-400">Agora</p>
          <h2 id="current-weather-title" className="mt-1 text-2xl font-semibold text-white">
            Clima atual em {city.name}
          </h2>
          <p className="mt-1 text-sm text-white/75">
            {[city.region, city.country].filter(Boolean).join(", ")}
          </p>
        </div>

        <div className="flex items-center gap-4 sm:text-right">
          <span role="img" aria-label={condition.description} className="text-5xl leading-none">
            {condition.icon}
          </span>
          <div>
            <p className="text-sm text-white/70">{condition.description}</p>
            <p className="mt-1 text-5xl font-semibold tabular-nums text-white">
              {formatTemperature(current?.temperatureC ?? null, unit)}
            </p>
          </div>
        </div>
      </div>

      <dl className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-white/10 bg-night-800/70 p-3">
          <dt className="text-xs text-white/75">Umidade</dt>
          <dd className="mt-1 font-medium text-white">
            {formatMetric(current?.relativeHumidityPercent ?? null, "%")}
          </dd>
        </div>
        <div className="rounded-lg border border-white/10 bg-night-800/70 p-3">
          <dt className="text-xs text-white/60">Vento</dt>
          <dd className="mt-1 font-medium text-white">{wind}</dd>
          {windDetails && <dd className="mt-1 text-xs text-white/75">{windDetails}</dd>}
        </div>
        <div className="rounded-lg border border-white/10 bg-night-800/70 p-3">
          <dt className="text-xs text-white/75">Precipitação</dt>
          <dd className="mt-1 font-medium text-white">
            {formatMetric(current?.precipitationLastHourMm ?? null, "mm")}
          </dd>
        </div>
        <div className="rounded-lg border border-white/10 bg-night-800/70 p-3">
          <dt className="text-xs text-white/75">Pressão ao nível do mar</dt>
          <dd className="mt-1 font-medium text-white">
            {formatMetric(current?.seaLevelPressureHpa ?? null, "hPa")}
          </dd>
        </div>
      </dl>
    </section>
  );
}