export function restartCutoff(value = process.env.NEWS_RESTART_UTC): string | null {
  if (value === undefined) return null;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(value) || !Number.isFinite(Date.parse(value)))
    throw new Error("NEWS_RESTART_UTC requires a UTC timestamp");
  return new Date(value).toISOString();
}
