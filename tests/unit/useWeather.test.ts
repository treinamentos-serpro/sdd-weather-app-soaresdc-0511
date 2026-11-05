import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { weatherDataMock } from "../../src/mocks/weatherData";
import {
  getWeather,
  searchCities,
  WeatherServiceError,
} from "../../src/services/weatherService";
import useWeather from "../../src/hooks/useWeather";
import type { City } from "../../src/types/weather";

vi.mock("../../src/services/weatherService", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/services/weatherService")>();
  return { ...actual, getWeather: vi.fn(), searchCities: vi.fn() };
});

const searchCitiesMock = vi.mocked(searchCities);
const getWeatherMock = vi.mocked(getWeather);

afterEach(() => {
  vi.resetAllMocks();
});

describe("useWeather", () => {
  it("começa em idle com estado vazio", () => {
    const { result } = renderHook(() => useWeather());

    expect(result.current.status).toBe("idle");
    expect(result.current.data).toBeNull();
    expect(result.current.cities).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(result.current.query).toBe("");
    expect(searchCitiesMock).not.toHaveBeenCalled();
    expect(getWeatherMock).not.toHaveBeenCalled();
  });

  it("ordena todos os candidatos, limita a dois e aguarda seleção explícita", async () => {
    searchCitiesMock.mockResolvedValue([
      { ...weatherDataMock.city, name: "Porto", providerId: 3 },
      { ...weatherDataMock.city, providerId: 2 },
      { ...weatherDataMock.city, name: "Águeda", providerId: 1 },
    ]);
    const { result } = renderHook(() => useWeather());

    await act(async () => result.current.search(" Lisboa "));

    expect(searchCitiesMock).toHaveBeenCalledWith("Lisboa", { signal: expect.any(AbortSignal) });
    expect(getWeatherMock).not.toHaveBeenCalled();
    expect(result.current.status).toBe("success");
    expect(result.current.cities).toHaveLength(2);
    expect(result.current.cities.map((city) => city.name)).toEqual(["Águeda", "Lisboa"]);
    expect(result.current.weatherState.status).toBe("idle");
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("usa empty e não chama forecast quando a busca não encontra cidades", async () => {
    searchCitiesMock.mockResolvedValue([]);
    const { result } = renderHook(() => useWeather());

    await act(async () => result.current.search("Cidade inexistente"));

    expect(result.current.status).toBe("empty");
    expect(result.current.data).toBeNull();
    expect(getWeatherMock).not.toHaveBeenCalled();
  });

  it("seleciona uma cidade diretamente e retry repete o último forecast", async () => {
    getWeatherMock.mockRejectedValueOnce(new WeatherServiceError("Falha de rede."));
    getWeatherMock.mockResolvedValueOnce(weatherDataMock);
    const { result } = renderHook(() => useWeather());

    await act(async () => result.current.selectCity(weatherDataMock.city));
    expect(result.current.status).toBe("error");

    await act(async () => result.current.retry());
    expect(getWeatherMock).toHaveBeenCalledTimes(2);
    expect(getWeatherMock).toHaveBeenLastCalledWith(weatherDataMock.city, { signal: expect.any(AbortSignal) });
    expect(searchCitiesMock).not.toHaveBeenCalled();
    expect(result.current.status).toBe("success");
    expect(result.current.data).toBe(weatherDataMock);
  });

  it("repete somente a busca quando o geocoding falha", async () => {
    searchCitiesMock.mockRejectedValueOnce(new WeatherServiceError("Falha de rede."));
    searchCitiesMock.mockResolvedValueOnce([weatherDataMock.city]);
    const { result } = renderHook(() => useWeather());
    await act(async () => result.current.search("Lisboa"));
    expect(result.current.searchState.status).toBe("error");
    await act(async () => result.current.retry());
    expect(searchCitiesMock).toHaveBeenCalledTimes(2);
    expect(getWeatherMock).not.toHaveBeenCalled();
    expect(result.current.searchState.status).toBe("success");
  });

  it("preserva dados e timestamp enquanto atualiza e após falha, sem repetir automaticamente", async () => {
    getWeatherMock.mockResolvedValueOnce(weatherDataMock);
    let rejectRefresh: (reason: Error) => void = () => {};
    getWeatherMock.mockImplementationOnce(() => new Promise((_resolve, reject) => { rejectRefresh = reject; }));
    const { result } = renderHook(() => useWeather());
    await act(async () => result.current.selectCity(weatherDataMock.city));

    let refreshRequest = Promise.resolve();
    act(() => { refreshRequest = result.current.refresh(); });
    expect(result.current.weatherState.status).toBe("loading");
    expect(result.current.data).toBe(weatherDataMock);

    await act(async () => {
      rejectRefresh(new WeatherServiceError("Prazo esgotado", undefined, "timeout"));
      await refreshRequest;
    });
    expect(result.current.weatherState).toMatchObject({ status: "error", city: weatherDataMock.city });
    expect(result.current.error?.kind).toBe("timeout");
    expect(result.current.data).toBe(weatherDataMock);
    expect(result.current.data?.lastSuccessfulQueryAt).toBe(weatherDataMock.lastSuccessfulQueryAt);
    expect(getWeatherMock).toHaveBeenCalledTimes(2);

    const refreshed = { ...weatherDataMock, lastSuccessfulQueryAt: "2026-11-05T13:00:00Z" };
    getWeatherMock.mockResolvedValueOnce(refreshed);
    await act(async () => result.current.retry());
    expect(result.current.data).toBe(refreshed);
    expect(result.current.error).toBeNull();
  });

  it("não conserva dados de outra cidade se a nova seleção falhar", async () => {
    getWeatherMock.mockResolvedValueOnce(weatherDataMock);
    getWeatherMock.mockRejectedValueOnce(new WeatherServiceError("Falha de rede."));
    const { result } = renderHook(() => useWeather());
    await act(async () => result.current.selectCity(weatherDataMock.city));
    const otherCity = { ...weatherDataMock.city, providerId: 2, name: "Porto" };
    await act(async () => result.current.selectCity(otherCity));
    expect(result.current.data).toBeNull();
    expect(result.current.weatherState).toMatchObject({ status: "error", city: otherCity });
  });

  it("cancela a busca anterior e ignora sua resposta tardia", async () => {
    let finishFirst: (cities: City[]) => void = () => {};
    searchCitiesMock.mockImplementationOnce(() => new Promise((resolve) => { finishFirst = resolve; }));
    const porto = { ...weatherDataMock.city, providerId: 2, name: "Porto" };
    searchCitiesMock.mockResolvedValueOnce([porto]);
    const { result } = renderHook(() => useWeather());
    let firstRequest = Promise.resolve();
    act(() => { firstRequest = result.current.search("Lisboa"); });
    const signal = searchCitiesMock.mock.calls[0]?.[1]?.signal;
    await act(async () => result.current.search("Porto"));
    expect(signal?.aborted).toBe(true);
    await act(async () => { finishFirst([weatherDataMock.city]); await firstRequest; });
    expect(result.current.query).toBe("Porto");
    expect(result.current.cities).toEqual([porto]);
  });

  it("cancela a requisição pendente ao desmontar", async () => {
    let finish: (cities: City[]) => void = () => {};
    searchCitiesMock.mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
    const { result, unmount } = renderHook(() => useWeather());
    let request = Promise.resolve();
    act(() => { request = result.current.search("Lisboa"); });
    const signal = searchCitiesMock.mock.calls[0]?.[1]?.signal;
    unmount();
    expect(signal?.aborted).toBe(true);
    await act(async () => { finish([weatherDataMock.city]); await request; });
  });
});