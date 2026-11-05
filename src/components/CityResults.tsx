import { useId } from 'react';
import type { City } from '../types/weather';

interface CityResultsProps {
  cities: City[];
  selectedId?: number;
  disabled?: boolean;
  onSelect: (city: City) => void;
}

export default function CityResults({
  cities,
  selectedId,
  disabled = false,
  onSelect,
}: CityResultsProps) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="space-y-3">
      <h2 id={headingId} className="text-lg font-semibold">
        Cidades encontradas
      </h2>
      <ul aria-label="Resultados da busca" className="grid gap-3 sm:grid-cols-2">
        {cities.map((city) => {
          const needsCoordinates = cities.some(
            (other) =>
              other.providerId !== city.providerId &&
              other.name === city.name &&
              other.country === city.country &&
              other.region === city.region,
          );

          return (
            <li key={city.providerId} className="min-w-0">
              <button
                type="button"
                aria-pressed={selectedId === city.providerId}
                disabled={disabled}
                onClick={() => onSelect(city)}
                className="w-full break-words rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-left hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 disabled:cursor-not-allowed disabled:opacity-60 aria-pressed:border-accent-400"
              >
                <span className="block font-medium">
                  {city.name}, {city.country}
                </span>
                {city.region && <span className="block text-sm text-white/75">{city.region}</span>}
                {needsCoordinates && (
                  <span className="block text-sm text-white/75">
                    ({city.latitude}, {city.longitude})
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
