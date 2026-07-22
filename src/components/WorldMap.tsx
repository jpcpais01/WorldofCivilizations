"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
  useMapContext,
  useZoomPanContext,
} from "react-simple-maps";
import { useMapStore } from "@/lib/store";
import { getCountryKey, getCountryName, isPaintable, COUNTRIES_TOPOLOGY_URL } from "@/lib/countries";
import { DEFAULT_BORDER_COLOR } from "@/lib/palette";
import type { CustomBorder, Region } from "@/lib/types";

const UNASSIGNED_FILL = "#2a3441";
const UNASSIGNED_HOVER = "#3a4759";
const STROKE = "#0d1117";
const MIN_ZOOM = 1;
const MAX_ZOOM = 20;

interface TooltipState {
  x: number;
  y: number;
  name: string;
  tier1Name?: string;
  tier2Name?: string;
}

function regionLabel(tier1?: Region, tier2?: Region): Pick<TooltipState, "tier1Name" | "tier2Name"> {
  return { tier1Name: tier1?.name, tier2Name: tier2?.name };
}

/** Converts a pointer event anywhere in the map to [lon, lat], correctly
 * accounting for the SVG's viewBox scaling (incl. preserveAspectRatio) and
 * the current pan/zoom transform - via the browser's own screen CTM rather
 * than hand-rolled math, so it stays exact at any zoom/aspect ratio. */
function eventToLonLat(
  evt: { clientX: number; clientY: number; currentTarget: EventTarget },
  projection: { invert?: (p: [number, number]) => [number, number] | null }
): [number, number] | null {
  const target = evt.currentTarget as SVGGraphicsElement;
  const svg = target.ownerSVGElement;
  if (!svg) return null;
  const ctm = target.getScreenCTM();
  if (!ctm) return null;
  const pt = svg.createSVGPoint();
  pt.x = evt.clientX;
  pt.y = evt.clientY;
  const local = pt.matrixTransform(ctm.inverse());
  return projection.invert?.([local.x, local.y]) ?? null;
}

function CustomBordersLayer({
  customBorders,
  regionsFor,
  paintMode,
  drawMode,
  onClick,
  onHover,
  onMove,
  onLeave,
}: {
  customBorders: CustomBorder[];
  regionsFor: (id: string) => { tier1?: Region; tier2?: Region };
  paintMode: boolean;
  drawMode: boolean;
  onClick: (id: string) => void;
  onHover: (evt: React.MouseEvent, id: string, name: string, tier1?: Region, tier2?: Region) => void;
  onMove: (evt: React.MouseEvent) => void;
  onLeave: () => void;
}) {
  const { projection } = useMapContext();
  const { k } = useZoomPanContext();

  return (
    <>
      {customBorders.map((border) => {
        const projected = border.points
          .map((p) => projection(p))
          .filter((p): p is [number, number] => !!p);
        if (projected.length < 3) return null;
        const pointsAttr = projected.map((p) => p.join(",")).join(" ");
        const { tier1, tier2 } = regionsFor(border.id);
        const active = tier2 ?? tier1;
        const color = border.color || DEFAULT_BORDER_COLOR;
        const fill = active ? active.color : `${color}26`;

        return (
          <polygon
            key={border.id}
            points={pointsAttr}
            fill={fill}
            stroke={color}
            strokeWidth={0.5 / k}
            strokeDasharray={`${2.5 / k} ${2 / k}`}
            style={{
              cursor: drawMode ? "default" : paintMode ? "crosshair" : "pointer",
              transition: "fill 120ms ease",
              pointerEvents: drawMode ? "none" : "auto",
            }}
            onMouseEnter={(evt) => onHover(evt, border.id, border.name, tier1, tier2)}
            onMouseMove={onMove}
            onMouseLeave={onLeave}
            onClick={() => onClick(border.id)}
          />
        );
      })}
    </>
  );
}

function DrawingOverlay() {
  const { projection } = useMapContext();
  const { k } = useZoomPanContext();
  const drawPoints = useMapStore((s) => s.drawPoints);
  const addDrawPoint = useMapStore((s) => s.addDrawPoint);

  const handleClick = useCallback(
    (evt: React.MouseEvent<SVGRectElement>) => {
      const lonLat = eventToLonLat(evt, projection);
      if (!lonLat) return;
      addDrawPoint(lonLat);
    },
    [projection, addDrawPoint]
  );

  const projected = drawPoints
    .map((p) => projection(p))
    .filter((p): p is [number, number] => !!p);
  const pointsAttr = projected.map((p) => p.join(",")).join(" ");

  return (
    <g>
      <rect
        x={-5000}
        y={-5000}
        width={10000}
        height={10000}
        fill="transparent"
        style={{ cursor: "crosshair" }}
        onClick={handleClick}
      />
      {projected.length > 1 && (
        <polyline
          points={pointsAttr}
          fill="none"
          stroke={DEFAULT_BORDER_COLOR}
          strokeWidth={0.6 / k}
          strokeDasharray={`${2.5 / k} ${2 / k}`}
        />
      )}
      {projected.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={1.6 / k} fill={DEFAULT_BORDER_COLOR} stroke="#0d1117" strokeWidth={0.4 / k} />
      ))}
    </g>
  );
}

export default function WorldMap() {
  const regions = useMapStore((s) => s.regions);
  const customBorders = useMapStore((s) => s.customBorders);
  const paintMode = useMapStore((s) => s.paintMode);
  const eraseMode = useMapStore((s) => s.eraseMode);
  const drawMode = useMapStore((s) => s.drawMode);
  const activeRegionId = useMapStore((s) => s.activeRegionId);
  const paintCountry = useMapStore((s) => s.paintCountry);
  const setSelectedCountry = useMapStore((s) => s.setSelectedCountry);

  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([0, 20]);

  const regionsFor = useCallback(
    (id: string) => ({
      tier1: regions.find((r) => r.tier === 1 && r.countryIds.includes(id)),
      tier2: regions.find((r) => r.tier === 2 && r.countryIds.includes(id)),
    }),
    [regions]
  );

  const handleClick = useCallback(
    (id: string) => {
      if (drawMode) return;
      if (paintMode) {
        if (!eraseMode && !activeRegionId) return;
        paintCountry(id);
      } else {
        setSelectedCountry(id);
      }
    },
    [drawMode, paintMode, eraseMode, activeRegionId, paintCountry, setSelectedCountry]
  );

  const cursor = useMemo(() => {
    if (drawMode) return "crosshair";
    if (paintMode) return "crosshair";
    return "pointer";
  }, [drawMode, paintMode]);

  return (
    <div className="relative h-full w-full select-none overflow-hidden bg-[#161b22]">
      <ComposableMap
        width={800}
        height={550}
        projection="geoMercator"
        projectionConfig={{ scale: 127, center: [0, 40] }}
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full"
        style={{ width: "100%", height: "100%" }}
      >
        <ZoomableGroup
          zoom={zoom}
          center={center}
          onMoveEnd={({ zoom: z, coordinates }) => {
            setZoom(z);
            setCenter(coordinates);
          }}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
        >
          <Geographies geography={COUNTRIES_TOPOLOGY_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const key = getCountryKey(geo);
                if (!isPaintable(key)) return null;
                const { tier1, tier2 } = regionsFor(key);
                const active = tier2 ?? tier1;
                const name = getCountryName(key, geo.properties?.name as string | undefined);
                const fill = active ? active.color : UNASSIGNED_FILL;

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={fill}
                    stroke={STROKE}
                    strokeWidth={0.4}
                    style={{
                      default: { outline: "none", transition: "fill 120ms ease" },
                      hover: {
                        outline: "none",
                        fill: active ? active.color : UNASSIGNED_HOVER,
                        filter: "brightness(1.2)",
                        cursor,
                      },
                      pressed: { outline: "none" },
                    }}
                    onMouseEnter={(evt) => {
                      if (drawMode) return;
                      setTooltip({ x: evt.clientX, y: evt.clientY, name, ...regionLabel(tier1, tier2) });
                    }}
                    onMouseMove={(evt) => {
                      if (drawMode) return;
                      setTooltip((t) => (t ? { ...t, x: evt.clientX, y: evt.clientY } : t));
                    }}
                    onMouseLeave={() => setTooltip(null)}
                    onClick={() => handleClick(key)}
                  />
                );
              })
            }
          </Geographies>

          <CustomBordersLayer
            customBorders={customBorders}
            regionsFor={regionsFor}
            paintMode={paintMode}
            drawMode={drawMode}
            onClick={handleClick}
            onHover={(evt, id, name, tier1, tier2) =>
              setTooltip({ x: evt.clientX, y: evt.clientY, name, ...regionLabel(tier1, tier2) })
            }
            onMove={(evt) => setTooltip((t) => (t ? { ...t, x: evt.clientX, y: evt.clientY } : t))}
            onLeave={() => setTooltip(null)}
          />

          {drawMode && <DrawingOverlay />}
        </ZoomableGroup>
      </ComposableMap>

      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 max-w-xs rounded-md border border-white/10 bg-[#0d1117]/95 px-3 py-1.5 text-sm text-white shadow-lg"
          style={{ left: tooltip.x + 14, top: tooltip.y + 14 }}
        >
          <div className="font-medium">{tooltip.name}</div>
          {tooltip.tier1Name && <div className="text-xs text-white/60">{tooltip.tier1Name}</div>}
          {tooltip.tier2Name && <div className="text-xs text-white/50">{tooltip.tier2Name}</div>}
        </div>
      )}

      {drawMode && (
        <div className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-black/40 px-2.5 py-1 text-xs text-amber-300 backdrop-blur">
          Click to place points &middot; use Finish/Undo/Cancel in the toolbar
        </div>
      )}
      {!drawMode && (
        <div className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-black/40 px-2.5 py-1 text-xs text-white/70 backdrop-blur">
          Scroll to zoom &middot; Drag to pan
        </div>
      )}

      <div className="absolute right-3 bottom-3 flex flex-col gap-1">
        <button
          className="h-8 w-8 rounded-md border border-white/10 bg-black/50 text-white/80 backdrop-blur hover:bg-black/70"
          onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z * 1.5))}
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          className="h-8 w-8 rounded-md border border-white/10 bg-black/50 text-white/80 backdrop-blur hover:bg-black/70"
          onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z / 1.5))}
          aria-label="Zoom out"
        >
          −
        </button>
      </div>
    </div>
  );
}
