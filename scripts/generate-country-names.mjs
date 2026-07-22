// One-off generator: builds src/lib/data/countryNames.json, a map of
// world-atlas topojson feature id -> friendly country/territory name.
// Run with: node scripts/generate-country-names.mjs
import { createRequire } from "module";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const require = createRequire(import.meta.url);
const topology = require("world-atlas/countries-50m.json");
const iso = require("i18n-iso-countries");
iso.registerLocale(require("i18n-iso-countries/langs/en.json"));

// Friendlier common names than the raw ISO "official" strings.
const OVERRIDES = {
  156: "China",
  158: "Taiwan",
  178: "Republic of the Congo",
  180: "DR Congo",
  203: "Czechia",
  270: "Gambia",
  275: "Palestine",
  364: "Iran",
  384: "Côte d'Ivoire",
  418: "Laos",
  498: "Moldova",
  583: "Micronesia",
  643: "Russia",
  760: "Syria",
  807: "North Macedonia",
  834: "Tanzania",
  840: "United States",
  850: "U.S. Virgin Islands",
  92: "British Virgin Islands",
  96: "Brunei",
  336: "Vatican City",
  238: "Falkland Islands",
};

// Not real paintable territories - drop from the interactive set.
const EXCLUDED = new Set(["010", "x-siachen-glacier"]);

const geometries = topology.objects.countries.geometries;
const map = {};

for (const g of geometries) {
  const numericId = g.id;
  let name;

  if (numericId) {
    const override = OVERRIDES[Number(numericId)];
    if (override) {
      name = override;
    } else {
      const alpha3 = iso.numericToAlpha3(numericId);
      name = alpha3 ? iso.getName(alpha3, "en") : undefined;
    }
  }

  if (!name && g.properties?.name) {
    name = g.properties.name;
  }

  const key = numericId || `x-${g.properties.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  if (EXCLUDED.has(key)) continue;

  map[key] = name || g.properties?.name || "Unknown";
}

const sorted = Object.fromEntries(
  Object.entries(map).sort((a, b) => a[1].localeCompare(b[1]))
);

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, "../src/lib/data/countryNames.json");
writeFileSync(outPath, JSON.stringify(sorted, null, 2) + "\n");

console.log(`Wrote ${Object.keys(sorted).length} country names to ${outPath}`);
