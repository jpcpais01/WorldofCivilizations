"use client";

import { useMemo } from "react";
import { useMapStore } from "@/lib/store";
import { useEntityName } from "@/lib/entityName";
import type { Region } from "@/lib/types";

function RegionLine({
  region,
  countryId,
}: {
  region: Region;
  countryId: string;
}) {
  const setActiveRegion = useMapStore((s) => s.setActiveRegion);
  const unassignFromRegion = useMapStore((s) => s.unassignFromRegion);

  return (
    <div className="mt-1 flex items-center gap-1.5 text-sm text-white/60">
      <span
        className="inline-block h-2.5 w-2.5 flex-none rounded-full"
        style={{ backgroundColor: region.color }}
      />
      <button onClick={() => setActiveRegion(region.id)} className="truncate hover:text-white hover:underline">
        {region.name}
      </button>
      <span className="flex-none rounded bg-white/10 px-1 py-0.5 text-[10px] uppercase text-white/40">
        T{region.tier}
      </span>
      <button
        onClick={() => unassignFromRegion(countryId, region.id)}
        className="flex-none text-white/30 hover:text-red-400"
        aria-label={`Remove from ${region.name}`}
      >
        ✕
      </button>
    </div>
  );
}

export default function CountryInfoCard() {
  const selectedCountryId = useMapStore((s) => s.selectedCountryId);
  const regions = useMapStore((s) => s.regions);
  const activeRegionId = useMapStore((s) => s.activeRegionId);
  const paintCountry = useMapStore((s) => s.paintCountry);
  const setSelectedCountry = useMapStore((s) => s.setSelectedCountry);
  const entityName = useEntityName();

  const { tier1, tier2 } = useMemo(() => {
    const id = selectedCountryId || "";
    return {
      tier1: regions.find((r) => r.tier === 1 && r.countryIds.includes(id)),
      tier2: regions.find((r) => r.tier === 2 && r.countryIds.includes(id)),
    };
  }, [regions, selectedCountryId]);

  if (!selectedCountryId) return null;
  const name = entityName(selectedCountryId);
  const activeRegion = regions.find((r) => r.id === activeRegionId);
  const alreadyInActive = activeRegion
    ? (activeRegion.tier === 1 ? tier1?.id : tier2?.id) === activeRegion.id
    : false;

  return (
    <div className="m-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="text-xs uppercase tracking-wide text-white/40">Selected</div>
          <div className="truncate font-medium text-white">{name}</div>
          {tier1 && <RegionLine region={tier1} countryId={selectedCountryId} />}
          {tier2 && <RegionLine region={tier2} countryId={selectedCountryId} />}
          {!tier1 && !tier2 && <div className="mt-0.5 text-sm text-white/40">Unassigned</div>}
        </div>
        <button
          onClick={() => setSelectedCountry(null)}
          className="flex-none text-white/40 hover:text-white/80"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>

      {activeRegion && !alreadyInActive && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          <button
            onClick={() => paintCountry(selectedCountryId)}
            className="rounded-md bg-white/10 px-2.5 py-1 text-xs text-white/80 hover:bg-white/20"
          >
            Add to {activeRegion.name} (T{activeRegion.tier})
          </button>
        </div>
      )}
    </div>
  );
}
