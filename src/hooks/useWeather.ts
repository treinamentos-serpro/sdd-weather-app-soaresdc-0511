import { useEffect, useRef, useState } from "react";
import { getWeather, searchCities, WeatherServiceError } from "../services/weatherService";
import type { City, WeatherData } from "../types/weather";

export type WeatherStatus = "idle" | "loading" | "success" | "error" | "empty";

export type SearchState =
  | { status: "idle" | "loading" | "empty"; query: string }
  | { status: "success"; query: string; cities: City[] }
  | { status: "error"; query: string; error: WeatherServiceError };

export type WeatherState =
  | { status: "idle" }
  | { status: "loading"; city: City; previous: WeatherData | null }
  | { status: "success"; data: WeatherData }
  | { status: "error"; city: City; error: WeatherServiceError; previous: WeatherData | null };

export interface UseWeatherResult {
  searchState: SearchState;
  weatherState: WeatherState;
  status: WeatherStatus;
  data: WeatherData | null;
  cities: City[];
  error: WeatherServiceError | null;
  query: string;
  search: (name: string) => Promise<void>;
  selectCity: (city: City) => Promise<void>;
  retry: () => Promise<void>;
  refresh: () => Promise<void>;
}

function toWeatherServiceError(error: unknown): WeatherServiceError {
  return error instanceof WeatherServiceError
    ? error
    : new WeatherServiceError("Falha inesperada ao consultar os dados do tempo.", undefined, "invalid-response");
}

const collator = new Intl.Collator("pt-BR");

function compareCities(first: City, second: City): number {
  return collator.compare(first.name, second.name) ||
    collator.compare(first.country, second.country) ||
    collator.compare(first.region ?? "", second.region ?? "") ||
    first.providerId - second.providerId;
}

function previousData(state: WeatherState): WeatherData | null {
  if (state.status === "success") return state.data;
  if (state.status === "loading" || state.status === "error") return state.previous;
  return null;
}

export default function useWeather(): UseWeatherResult {
  const [searchState, setSearchState] = useState<SearchState>({ status: "idle", query: "" });
  const [weatherState, setWeatherState] = useState<WeatherState>({ status: "idle" });
  const requestRef = useRef({ id: 0, controller: null as AbortController | null });

  useEffect(() => () => {
    requestRef.current.id += 1;
    requestRef.current.controller?.abort();
  }, []);

  function startRequest() {
    requestRef.current.controller?.abort();
    const request = { id: requestRef.current.id + 1, controller: new AbortController() };
    requestRef.current = request;
    return request;
  }

  async function search(name: string): Promise<void> {
    const query = name.trim();
    const request = startRequest();
    setWeatherState({ status: "idle" });
    setSearchState({ status: query ? "loading" : "idle", query });
    if (!query) return;

    try {
      const results = await searchCities(query, { signal: request.controller.signal });
      if (request.id !== requestRef.current.id) return;
      const cities = [...results].sort(compareCities).slice(0, 2);
      setSearchState(cities.length ? { status: "success", query, cities } : { status: "empty", query });
    } catch (caughtError) {
      if (request.id !== requestRef.current.id) return;
      setSearchState({ status: "error", query, error: toWeatherServiceError(caughtError) });
    }
  }

  async function selectCity(city: City): Promise<void> {
    const request = startRequest();
    const existing = previousData(weatherState);
    const previous = existing?.city.providerId === city.providerId ? existing : null;
    setWeatherState({ status: "loading", city, previous });

    try {
      const data = await getWeather(city, { signal: request.controller.signal });
      if (request.id !== requestRef.current.id) return;
      setWeatherState({ status: "success", data });
    } catch (caughtError) {
      if (request.id !== requestRef.current.id) return;
      setWeatherState({ status: "error", city, error: toWeatherServiceError(caughtError), previous });
    }
  }

  async function retry(): Promise<void> {
    if (weatherState.status === "error") {
      await selectCity(weatherState.city);
    } else if (searchState.status === "error") {
      await search(searchState.query);
    }
  }

  async function refresh(): Promise<void> {
    if (searchState.status === "loading" || weatherState.status === "loading") return;
    if (weatherState.status === "success") await selectCity(weatherState.data.city);
    if (weatherState.status === "error") await selectCity(weatherState.city);
  }

  return {
    searchState,
    weatherState,
    status: weatherState.status === "idle" ? searchState.status : weatherState.status,
    data: previousData(weatherState),
    cities: searchState.status === "success" ? searchState.cities : [],
    error: weatherState.status === "error" ? weatherState.error : searchState.status === "error" ? searchState.error : null,
    query: searchState.query,
    search,
    selectCity,
    retry,
    refresh,
  };
}