"use client";

import { useCallback, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import { useMapStore } from "@/lib/store";
import { getCountryKey, getCountryName, isPaintable, COUNTRIES_TOPOLOGY_URL } from "@/lib/countries";

const UNASSIGNED_FILL = "#2a3441";
const UNASSIGNED_HOVER = "#3a4759";
const STROKE = "#0d1117";

interface TooltipState {
  x: number;
  y: number;
  countryName: string;
  regionName: string | null;
}

export default function WorldMap() {
  const regions = useMapStore((s) => s.regions);
  const paintMode = useMapStore((s) => s.paintMode);
  const eraseMode = useMapStore((s) => s.eraseMode);
  const activeRegionId = useMapStore((s) => s.activeRegionId);
  const paintCountry = useMapStore((s) => s.paintCountry);
  const setSelectedCountry = useMapStore((s) => s.setSelectedCountry);

  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([0, 20]);

  const regionColorByCountry = useCallback(
    (key: string) => {
      for (const r of regions) {
        if (r.countryIds.includes(key)) return r;
      }
      return undefined;
    },
    [regions]
  );

  const handleClick = useCallback(
    (key: string) => {
      if (paintMode) {
        if (!eraseMode && !activeRegionId) return;
        paintCountry(key);
      } else {
        setSelectedCountry(key);
      }
    },
    [paintMode, eraseMode, activeRegionId, paintCountry, setSelectedCountry]
  );

  return (
    <div className="relative h-full w-full select-none overflow-hidden bg-[#161b22]">
      <ComposableMap
        projectionConfig={{ scale: 155 }}
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
          minZoom={1}
          maxZoom={8}
        >
          <Geographies geography={COUNTRIES_TOPOLOGY_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const key = getCountryKey(geo);
                if (!isPaintable(key)) return null;
                const region = regionColorByCountry(key);
                const name = getCountryName(key, geo.properties?.name as string | undefined);
                const fill = region ? region.color : UNASSIGNED_FILL;

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
                        fill: region ? region.color : UNASSIGNED_HOVER,
                        filter: "brightness(1.2)",
                        cursor: paintMode ? "crosshair" : "pointer",
                      },
                      pressed: { outline: "none" },
                    }}
                    onMouseEnter={(evt) => {
                      setTooltip({
                        x: evt.clientX,
                        y: evt.clientY,
                        countryName: name,
                        regionName: region?.name ?? null,
                      });
                    }}
                    onMouseMove={(evt) => {
                      setTooltip((t) =>
                        t ? { ...t, x: evt.clientX, y: evt.clientY } : t
                      );
                    }}
                    onMouseLeave={() => setTooltip(null)}
                    onClick={() => handleClick(key)}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 max-w-xs rounded-md border border-white/10 bg-[#0d1117]/95 px-3 py-1.5 text-sm text-white shadow-lg"
          style={{ left: tooltip.x + 14, top: tooltip.y + 14 }}
        >
          <div className="font-medium">{tooltip.countryName}</div>
          {tooltip.regionName && (
            <div className="text-xs text-white/60">{tooltip.regionName}</div>
          )}
        </div>
      )}

      <div className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-black/40 px-2.5 py-1 text-xs text-white/70 backdrop-blur">
        Scroll to zoom &middot; Drag to pan
      </div>

      <div className="absolute right-3 bottom-3 flex flex-col gap-1">
        <button
          className="h-8 w-8 rounded-md border border-white/10 bg-black/50 text-white/80 backdrop-blur hover:bg-black/70"
          onClick={() => setZoom((z) => Math.min(8, z * 1.5))}
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          className="h-8 w-8 rounded-md border border-white/10 bg-black/50 text-white/80 backdrop-blur hover:bg-black/70"
          onClick={() => setZoom((z) => Math.max(1, z / 1.5))}
          aria-label="Zoom out"
        >
          −
        </button>
      </div>
    </div>
  );
}
