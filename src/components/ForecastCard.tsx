import type { ForecastDay, Unit } from "../types/weather";
import { formatForecastDayLabel } from "../lib/format";
import { formatTemperature } from "../lib/temperature";
import { getWeatherCodeInfo } from "../lib/weatherCodes";

interface ForecastCardProps {
  day: ForecastDay;
  unit: Unit;
}

export default function ForecastCard({ day, unit }: ForecastCardProps) {
  const dayLabel = formatForecastDayLabel(day.localDate);
  const weather = getWeatherCodeInfo(day.weatherCode);
  const precipitation =
    day.precipitationProbabilityMaxPercent === null
      ? "Indisponível"
      : `${day.precipitationProbabilityMaxPercent}%`;

  return (
    <article
      aria-label={`Previsão para ${dayLabel}`}
      className="flex h-full flex-col gap-4 rounded-xl border border-white/10 bg-white/5 p-4 shadow-glass backdrop-blur-md"
    >
      <header className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold capitalize text-white">{dayLabel}</h3>
        <span
          role="img"
          aria-label={weather.description}
          className="text-2xl leading-none"
        >
          {weather.icon}
        </span>
      </header>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-xs text-white/75">Máx.</dt>
          <dd className="mt-1 text-lg font-semibold text-white">
            {formatTemperature(day.temperatureMaxC, unit)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-white/75">Mín.</dt>
          <dd className="mt-1 text-lg font-semibold text-white">
            {formatTemperature(day.temperatureMinC, unit)}
          </dd>
        </div>
      </dl>

      <p className="mt-auto text-sm text-white/80">
        Chuva: <span className="font-medium text-white">{precipitation}</span>
      </p>
    </article>
  );
}