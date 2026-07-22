import countryNames from "@/lib/data/countryNames.json";

export const COUNTRIES_TOPOLOGY_URL = "/data/countries-50m.json";

const NAMES: Record<string, string> = countryNames;

/** Excluded from the interactive/paintable set (not real countries). */
const EXCLUDED_KEYS = new Set(["010", "x-siachen-glacier"]);

export interface RawGeography {
  rsmKey: string;
  id?: string;
  properties?: Record<string, unknown>;
}

/** Stable identity for a geography feature, whether or not it has an ISO id. */
export function getCountryKey(geo: RawGeography): string {
  if (geo.id) return String(geo.id);
  const name = (geo.properties?.name as string) || geo.rsmKey;
  return `x-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

export function getCountryName(key: string, fallback?: string): string {
  return NAMES[key] || fallback || "Unknown territory";
}

export function isPaintable(key: string): boolean {
  return !EXCLUDED_KEYS.has(key);
}

export function allCountryKeys(): string[] {
  return Object.keys(NAMES);
}

export { NAMES as countryNames };
