import {
  buffer,
  centroid,
  difference,
  featureCollection,
  flatten,
  rewind,
  bbox as turfBbox,
  booleanIntersects,
} from "@turf/turf";
import type { Feature, LineString, Polygon, MultiPolygon, BBox, Position } from "geojson";
import type { CustomBorder } from "@/lib/types";

/** Width of the "cut" a custom border line makes through a country, in degrees. */
const CUT_WIDTH_DEGREES = 0.03;

export interface SplitPiece {
  /** `${countryKey}::${groupIndex}` - stable as long as the same lines cross this country. */
  id: string;
  /** Kept as separate Polygon fragments (mainland + islands) rather than
   * merged into one MultiPolygon - d3-geo's antimeridian pre-clipping can
   * badly misrender a MultiPolygon built by naively concatenating rings from
   * unrelated source polygons, tracing a huge stray shape across the map. */
  features: Feature<Polygon>[];
}

function bboxesOverlap(a: BBox, b: BBox): boolean {
  return a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1];
}

function toLineFeature(border: CustomBorder): Feature<LineString> | null {
  if (border.points.length < 2) return null;
  return {
    type: "Feature",
    properties: {},
    geometry: { type: "LineString", coordinates: border.points },
  };
}

/** Which side of a line's start-to-end chord a point falls on. Treating a
 * multi-bend hand-drawn line as a straight chord is an approximation, but a
 * good enough one for grouping fragments into "left of the line" / "right of
 * the line" without needing real point-to-polyline geometry. */
function sideOfLine(point: Position, line: Feature<LineString>): 0 | 1 {
  const coords = line.geometry.coordinates;
  const [x1, y1] = coords[0];
  const [x2, y2] = coords[coords.length - 1];
  const [px, py] = point;
  const cross = (x2 - x1) * (py - y1) - (y2 - y1) * (px - x1);
  return cross >= 0 ? 1 : 0;
}

/**
 * Splits a country's geometry into pieces wherever a custom border line cuts
 * through it (by subtracting a thin buffer around each relevant line), then
 * regroups the resulting fragments by which side of the line(s) they fall on
 * - so small offshore islands rejoin whichever half they belong to instead of
 * becoming their own tiny paintable region. Returns null if no line actually
 * crosses this country, so the caller can fall back to rendering/painting
 * the whole country as usual.
 */
export function splitCountryByLines(
  countryKey: string,
  countryGeometry: Polygon | MultiPolygon,
  lines: CustomBorder[]
): SplitPiece[] | null {
  if (lines.length === 0) return null;

  const countryFeature: Feature<Polygon | MultiPolygon> = {
    type: "Feature",
    properties: {},
    geometry: countryGeometry,
  };
  const countryBbox = turfBbox(countryFeature);

  // Countries that cross the antimeridian (Russia, Fiji, USA via the Aleutians,
  // etc.) get a naive bounding box spanning the whole globe, which breaks both
  // the bbox prefilter and turf's own intersection/clipping math. Splitting
  // isn't supported for these - fall back to painting them as a whole country.
  if (countryBbox[2] - countryBbox[0] > 180) return null;

  const relevantLines = lines
    .map(toLineFeature)
    .filter((f): f is Feature<LineString> => {
      if (!f) return false;
      if (!bboxesOverlap(countryBbox, turfBbox(f))) return false;
      try {
        return booleanIntersects(countryFeature, f);
      } catch {
        return false;
      }
    });

  if (relevantLines.length === 0) return null;

  let current: Feature<Polygon | MultiPolygon> = countryFeature;
  let changed = false;

  for (const line of relevantLines) {
    let buffered;
    try {
      buffered = buffer(line, CUT_WIDTH_DEGREES, { units: "degrees" });
    } catch {
      continue;
    }
    if (!buffered) continue;

    try {
      const result = difference(featureCollection([current, buffered]));
      if (result) {
        current = result;
        changed = true;
      }
    } catch {
      // Leave `current` as-is on failure (e.g. degenerate geometry) and try the next line.
    }
  }

  if (!changed) return null;

  let fragments;
  try {
    // Polygon clipping doesn't guarantee RFC 7946 ring winding, and d3-geo's
    // antimeridian pre-clip badly misrenders a wrongly-wound ring (it can
    // trace a huge stray shape covering most of the map) - rewind every
    // fragment before it's ever handed to the renderer.
    fragments = flatten(current).features.map((f) => rewind(f, { mutate: true })) as Feature<Polygon>[];
  } catch {
    return null;
  }

  if (fragments.length < 2) return null;

  // Group fragments (mainland pieces, islands, etc.) by which side of every
  // relevant line their centroid is on, so each group is one paintable area.
  const groups = new Map<string, Feature<Polygon>[]>();
  for (const fragment of fragments) {
    const c = centroid(fragment).geometry.coordinates;
    const signature = relevantLines.map((line) => sideOfLine(c, line)).join("");
    const group = groups.get(signature);
    if (group) group.push(fragment);
    else groups.set(signature, [fragment]);
  }

  if (groups.size < 2) return null;

  return Array.from(groups.values()).map((group, i) => ({
    id: `${countryKey}::${i}`,
    features: group,
  }));
}

/** True if `id` looks like a split-piece id produced by splitCountryByLines. */
export function isSplitPieceId(id: string): boolean {
  return /::\d+$/.test(id);
}

/** Extracts the base country key from a split-piece id. */
export function splitPieceCountryKey(id: string): string {
  return id.replace(/::\d+$/, "");
}
