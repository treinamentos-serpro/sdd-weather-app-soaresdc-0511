export function averageForLocalDate(
  times: string[] | undefined,
  values: Array<number | null> | undefined,
  localDate: string,
): number | null {
  if (!times || !values || times.length !== values.length) return null;

  let total = 0;
  let count = 0;

  for (let index = 0; index < times.length; index += 1) {
    if (times[index]?.slice(0, 10) !== localDate) continue;

    const value = values[index];
    if (typeof value !== "number" || !Number.isFinite(value)) continue;

    total += value;
    count += 1;
  }

  return count === 0 ? null : total / count;
}