import type { Unit } from "../types/weather";

function roundToTenthHalfAwayFromZero(value: number): number {
  const scaled = Math.abs(value) * 10;
  const epsilon = Number.EPSILON * Math.max(1, scaled) * 8;
  return Math.sign(value) * Math.floor(scaled + 0.5 + epsilon) / 10;
}

export function formatTemperature(
  temperatureC: number | null,
  unit: Unit,
): string {
  if (temperatureC === null) return "Indisponível";

  const converted = unit === "fahrenheit" ? temperatureC * (9 / 5) + 32 : temperatureC;
  const rounded = roundToTenthHalfAwayFromZero(converted);
  const formatted = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(rounded);

  return `${formatted} °${unit === "celsius" ? "C" : "F"}`;
}