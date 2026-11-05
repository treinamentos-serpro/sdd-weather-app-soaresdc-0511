import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import CityResults from './components/CityResults';
import CurrentWeather from './components/CurrentWeather';
import ForecastList from './components/ForecastList';
import SearchBar from './components/SearchBar';
import EmptyState from './components/states/EmptyState';
import ErrorState from './components/states/ErrorState';
import LoadingState from './components/states/LoadingState';
import UnitToggle from './components/UnitToggle';
import useWeather from './hooks/useWeather';
import type { Unit } from './types/weather';

export default function App() {
  const [unit, setUnit] = useState<Unit>('celsius');
  const { searchState, weatherState, cities, data, error, search, selectCity, retry, refresh } =
    useWeather();
  const loading = searchState.status === 'loading' || weatherState.status === 'loading';
  const selectedCity =
    weatherState.status === 'success'
      ? weatherState.data.city
      : weatherState.status === 'idle'
        ? null
        : weatherState.city;
  const errorMessage =
    error?.kind === 'timeout'
      ? 'A consulta excedeu 10 segundos. Tente novamente.'
      : 'Não foi possível consultar os dados do tempo. Tente novamente.';

  return (
    <div className="min-h-screen bg-night-900 text-white">
      <header className="border-b border-white/10 bg-night-900/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-5 sm:px-6 lg:flex-row lg:items-center">
          <div className="flex items-center justify-between gap-4 lg:w-56 lg:shrink-0">
            <h1 className="m-0 text-lg font-semibold">
              <span className="flex items-center gap-2 text-white">
                <span aria-hidden="true" className="text-xl">
                  ☀️
                </span>
                <span>Weather</span>
              </span>
            </h1>
            <UnitToggle unit={unit} onChange={setUnit} />
          </div>

          <SearchBar onSearch={search} disabled={loading} />
        </div>
      </header>

      <main
        id="main-content"
        className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8"
      >
        {searchState.status === 'idle' && weatherState.status === 'idle' && (
          <EmptyState title="Busque uma cidade" hint="Nenhuma cidade consultada." />
        )}

        {loading && (
          <LoadingState
            message={
              searchState.status === 'loading' ? 'Buscando cidades...' : 'Buscando o clima...'
            }
          />
        )}

        {searchState.status === 'success' && (
          <CityResults
            cities={cities}
            selectedId={selectedCity?.providerId}
            disabled={loading}
            onSelect={selectCity}
          />
        )}

        {searchState.status === 'empty' && (
          <EmptyState
            title="Nenhuma cidade encontrada"
            hint="Verifique a grafia e tente novamente."
          />
        )}

        {error && <ErrorState message={errorMessage} onRetry={retry} />}

        {data && (
          <>
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 text-sm text-white/75">
                {weatherState.status === 'error' && (
                  <p role="status" className="font-semibold text-amber-200">
                    Desatualizado
                  </p>
                )}
                <p>
                  Última consulta bem-sucedida:{' '}
                  <time dateTime={data.lastSuccessfulQueryAt}>
                    {new Intl.DateTimeFormat('pt-BR', {
                      dateStyle: 'short',
                      timeStyle: 'medium',
                      timeZone: data.city.timezone ?? 'UTC',
                    }).format(new Date(data.lastSuccessfulQueryAt))}
                  </time>
                </p>
              </div>
              <button
                type="button"
                aria-label="Atualizar dados"
                title="Atualizar dados"
                disabled={loading}
                onClick={refresh}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw size={18} aria-hidden="true" />
              </button>
            </div>
            <CurrentWeather city={data.city} current={data.current} unit={unit} />
            <section aria-labelledby="forecast-heading" className="space-y-4">
              <div>
                <p className="text-sm font-medium text-accent-400">Planejamento</p>
                <h2 id="forecast-heading" className="mt-1 text-xl font-semibold text-white">
                  Próximos cinco dias
                </h2>
              </div>
              <ForecastList forecast={data.forecast} unit={unit} />
            </section>
          </>
        )}

        <p className="text-center text-xs text-white/70">Dados meteorológicos: Open-Meteo.</p>
      </main>
    </div>
  );
}
