"use client";

import { useMemo } from "react";
import { useMapStore } from "@/lib/store";
import { getCountryName } from "@/lib/countries";

export default function CountryInfoCard() {
  const selectedCountryId = useMapStore((s) => s.selectedCountryId);
  const regions = useMapStore((s) => s.regions);
  const activeRegionId = useMapStore((s) => s.activeRegionId);
  const paintCountry = useMapStore((s) => s.paintCountry);
  const unassignCountry = useMapStore((s) => s.unassignCountry);
  const setSelectedCountry = useMapStore((s) => s.setSelectedCountry);
  const setActiveRegion = useMapStore((s) => s.setActiveRegion);

  const region = useMemo(
    () => regions.find((r) => r.countryIds.includes(selectedCountryId || "")),
    [regions, selectedCountryId]
  );

  if (!selectedCountryId) return null;
  const name = getCountryName(selectedCountryId);
  const activeRegion = regions.find((r) => r.id === activeRegionId);

  return (
    <div className="m-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-white/40">Selected</div>
          <div className="font-medium text-white">{name}</div>
          {region ? (
            <div className="mt-0.5 flex items-center gap-1.5 text-sm text-white/60">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: region.color }}
              />
              {region.name}
            </div>
          ) : (
            <div className="mt-0.5 text-sm text-white/40">Unassigned</div>
          )}
        </div>
        <button
          onClick={() => setSelectedCountry(null)}
          className="text-white/40 hover:text-white/80"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {activeRegion && activeRegion.id !== region?.id && (
          <button
            onClick={() => paintCountry(selectedCountryId)}
            className="rounded-md bg-white/10 px-2.5 py-1 text-xs text-white/80 hover:bg-white/20"
          >
            Add to {activeRegion.name}
          </button>
        )}
        {region && (
          <button
            onClick={() => unassignCountry(selectedCountryId)}
            className="rounded-md bg-white/10 px-2.5 py-1 text-xs text-white/80 hover:bg-white/20"
          >
            Remove from region
          </button>
        )}
        {region && (
          <button
            onClick={() => setActiveRegion(region.id)}
            className="rounded-md bg-white/10 px-2.5 py-1 text-xs text-white/80 hover:bg-white/20"
          >
            Open {region.name}
          </button>
        )}
      </div>
    </div>
  );
}
