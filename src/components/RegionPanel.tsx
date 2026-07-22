"use client";

import { useState } from "react";
import { useMapStore } from "@/lib/store";
import { getCountryName } from "@/lib/countries";
import PhotoGallery from "@/components/PhotoGallery";
import type { Region } from "@/lib/types";

function RegionRow({ region }: { region: Region }) {
  const activeRegionId = useMapStore((s) => s.activeRegionId);
  const setActiveRegion = useMapStore((s) => s.setActiveRegion);
  const updateRegion = useMapStore((s) => s.updateRegion);
  const deleteRegion = useMapStore((s) => s.deleteRegion);

  const isOpen = activeRegionId === region.id;
  const [nameDraft, setNameDraft] = useState(region.name);

  const handleDelete = () => {
    if (confirm(`Delete "${region.name}"? Its countries become unassigned.`)) {
      deleteRegion(region.id);
    }
  };

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] overflow-hidden">
      <button
        onClick={() => setActiveRegion(isOpen ? null : region.id)}
        className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition ${
          isOpen ? "bg-white/[0.06]" : "hover:bg-white/[0.04]"
        }`}
      >
        <input
          type="color"
          value={region.color}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => updateRegion(region.id, { color: e.target.value })}
          className="h-6 w-6 flex-none cursor-pointer rounded border border-white/20 bg-transparent p-0"
        />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-white">{region.name}</div>
          <div className="text-xs text-white/40">
            {region.countryIds.length} {region.countryIds.length === 1 ? "country" : "countries"}
            {region.photos.length > 0 && ` · ${region.photos.length} photos`}
          </div>
        </div>
        <span className="text-white/30">{isOpen ? "▾" : "▸"}</span>
      </button>

      {isOpen && (
        <div className="space-y-3 border-t border-white/10 px-3 py-3">
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-white/40">
              Name
            </label>
            <input
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={() => updateRegion(region.id, { name: nameDraft.trim() || region.name })}
              className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-sm text-white outline-none focus:border-white/30"
            />
          </div>

          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-white/40">
              Description
            </label>
            <textarea
              value={region.description}
              onChange={(e) => updateRegion(region.id, { description: e.target.value })}
              placeholder="What makes this region special?"
              rows={3}
              className="mt-1 w-full resize-none rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-sm text-white outline-none focus:border-white/30"
            />
          </div>

          {region.countryIds.length > 0 && (
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-white/40">
                Countries
              </label>
              <div className="mt-1 flex flex-wrap gap-1">
                {region.countryIds.map((id) => (
                  <span
                    key={id}
                    className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/70"
                  >
                    {getCountryName(id)}
                  </span>
                ))}
              </div>
            </div>
          )}

          <PhotoGallery regionId={region.id} photos={region.photos} />

          <div className="flex justify-end pt-1">
            <button
              onClick={handleDelete}
              className="rounded-md px-2.5 py-1 text-xs text-red-400/80 hover:bg-red-500/10 hover:text-red-400"
            >
              Delete region
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RegionPanel() {
  const regions = useMapStore((s) => s.regions);
  const addRegion = useMapStore((s) => s.addRegion);
  const paintMode = useMapStore((s) => s.paintMode);
  const [newName, setNewName] = useState("");

  const handleAdd = () => {
    addRegion(newName || `Region ${regions.length + 1}`);
    setNewName("");
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between px-3 pt-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-white/50">
          Regions ({regions.length})
        </h2>
      </div>

      <div className="flex gap-1.5 p-3">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="New region name…"
          className="min-w-0 flex-1 rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-sm text-white outline-none focus:border-white/30"
        />
        <button
          onClick={handleAdd}
          className="flex-none rounded-md bg-emerald-500 px-3 py-1.5 text-sm font-medium text-black hover:bg-emerald-400"
        >
          + Add
        </button>
      </div>

      {paintMode && regions.length === 0 && (
        <div className="mx-3 mb-3 rounded-md border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-xs text-amber-300">
          Create a region first, then click it below to select it, then click countries on the map.
        </div>
      )}

      <div className="flex-1 space-y-2 overflow-y-auto px-3 pb-4">
        {regions.length === 0 ? (
          <div className="mt-6 text-center text-sm text-white/30">
            No regions yet. Add one above to start painting.
          </div>
        ) : (
          regions.map((region) => <RegionRow key={region.id} region={region} />)
        )}
      </div>
    </div>
  );
}
