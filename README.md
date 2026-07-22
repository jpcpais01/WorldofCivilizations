# World Painter

Paint the real world map into your own regions. Click countries to assign them
to custom regions, give each region a name, color, description, and photos,
and see it all rendered on a clean interactive world map.

## Features

- **Real country borders** — all ~238 UN-recognized countries and territories,
  from the Natural Earth dataset (via `world-atlas`, 1:50m resolution).
- **Custom borders** — draw your own shapes with a connected-line-segment tool
  (click to place points, Finish to close it into a polygon). Drawn shapes
  behave exactly like countries: paintable, nameable, and paintable into any
  region.
- **Paint mode** — pick a region, click countries or custom shapes to add them
  to it; an erase mode to unassign.
- **Tiered regions** — regions come in two tiers: Tier 1 (e.g. continents) and
  Tier 2 (sub-regions that live inside a Tier 1). A country/shape can hold one
  of each at once — painting a Tier 2 region automatically nests it inside its
  parent Tier 1 region unless the country already belongs to a different one.
  The map shows the Tier 2 color on top when both are set.
- **Regions** — create unlimited regions, each with its own color, name, and
  description.
- **Photos** — upload photos per region (auto-resized/compressed client-side),
  with captions and a lightbox viewer.
- **Pan & zoom** — scroll to zoom, drag to pan, with zoom buttons.
- **Persistence** — everything is saved locally in the browser via IndexedDB,
  so your map survives reloads with no backend required.
- **Export / Import** — download your regions, custom borders, and photos as
  a JSON file, and re-import it later or on another device.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How it works

- **Map & data**: [`react-simple-maps`](https://www.react-simple-maps.io/)
  renders an SVG map from `public/data/countries-50m.json`, a TopoJSON file
  from the [`world-atlas`](https://github.com/topojson/world-atlas) package.
  Country names are resolved via `src/lib/data/countryNames.json`, generated
  once with `node scripts/generate-country-names.mjs` (re-run it if you swap
  in a different topology).
- **State**: [`zustand`](https://github.com/pmndrs/zustand) holds regions,
  custom borders, and their assigned countries, persisted to IndexedDB via
  `idb-keyval` so data survives refreshes without a server.
- **Custom borders**: drawing uses `react-simple-maps`' `useMapContext`/
  `useZoomPanContext` hooks to invert click coordinates through the current
  projection and zoom/pan transform into `[lon, lat]`, so shapes are stored
  zoom-independent and re-project correctly at any zoom level.
- **Photos**: images are downscaled and JPEG-compressed in the browser
  (`src/lib/image.ts`) before being stored as data URLs, keeping IndexedDB
  usage reasonable.

Everything runs client-side — there's no database or API to configure.

## Deploying to Vercel

This is a standard Next.js App Router project, so it deploys to Vercel with
zero configuration:

1. Push this repo to GitHub (or your Git provider of choice).
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. Leave all settings at their defaults (Framework Preset: Next.js) and
   deploy.

Or from the CLI:

```bash
npm i -g vercel
vercel
```

No environment variables or external services are required — all data lives
in the visitor's browser.
