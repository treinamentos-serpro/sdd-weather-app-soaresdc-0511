export function formatForecastDayLabel(localDate: string): string {
  const date = new Date(`${localDate}T12:00:00Z`);

  if (Number.isNaN(date.getTime())) return localDate;

  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(date);
}