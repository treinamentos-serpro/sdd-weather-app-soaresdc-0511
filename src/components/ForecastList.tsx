import type { ForecastDay, Unit } from "../types/weather";
import ForecastCard from "./ForecastCard";

interface ForecastListProps {
  forecast: ForecastDay[];
  unit: Unit;
}

export default function ForecastList({ forecast, unit }: ForecastListProps) {
  if (forecast.length === 0) {
    return (
      <p role="status" className="text-sm text-white/75">
        Previsão indisponível.
      </p>
    );
  }

  return (
    <ol
      aria-label="Previsão de cinco dias"
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
    >
      {forecast.slice(0, 5).map((day) => (
        <li key={day.localDate} className="min-w-0">
          <ForecastCard day={day} unit={unit} />
        </li>
      ))}
    </ol>
  );
}