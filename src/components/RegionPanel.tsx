"use client";

import { useState } from "react";
import { useMapStore } from "@/lib/store";
import { useEntityName } from "@/lib/entityName";
import PhotoGallery from "@/components/PhotoGallery";
import type { Region } from "@/lib/types";

function RegionRow({ region, nested = false }: { region: Region; nested?: boolean }) {
  const activeRegionId = useMapStore((s) => s.activeRegionId);
  const setActiveRegion = useMapStore((s) => s.setActiveRegion);
  const updateRegion = useMapStore((s) => s.updateRegion);
  const deleteRegion = useMapStore((s) => s.deleteRegion);
  const entityName = useEntityName();

  const isOpen = activeRegionId === region.id;
  const [nameDraft, setNameDraft] = useState(region.name);

  const handleDelete = () => {
    const msg =
      region.tier === 1
        ? `Delete "${region.name}"? Its tier-2 sub-regions and all painted countries/borders will be unassigned too.`
        : `Delete "${region.name}"? Its countries/borders become unassigned.`;
    if (confirm(msg)) {
      deleteRegion(region.id);
    }
  };

  return (
    <div
      className={`overflow-hidden rounded-lg border border-white/10 bg-white/[0.02] ${nested ? "ml-4" : ""}`}
    >
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
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-medium text-white">{region.name}</span>
            <span className="flex-none rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-white/50">
              T{region.tier}
            </span>
          </div>
          <div className="text-xs text-white/40">
            {region.countryIds.length} {region.countryIds.length === 1 ? "entity" : "entities"}
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
                Countries &amp; borders
              </label>
              <div className="mt-1 flex flex-wrap gap-1">
                {region.countryIds.map((id) => (
                  <span
                    key={id}
                    className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/70"
                  >
                    {entityName(id)}
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
  const [newTier, setNewTier] = useState<1 | 2>(1);
  const [newParentId, setNewParentId] = useState<string>("");

  const tier1Regions = regions.filter((r) => r.tier === 1);
  const tier2Regions = regions.filter((r) => r.tier === 2);

  const handleAdd = () => {
    if (newTier === 2 && !newParentId) return;
    addRegion(newName || `Region ${regions.length + 1}`, {
      tier: newTier,
      parentId: newTier === 2 ? newParentId : null,
    });
    setNewName("");
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between px-3 pt-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-white/50">
          Regions ({regions.length})
        </h2>
      </div>

      <div className="space-y-1.5 p-3">
        <div className="flex gap-1.5">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="New region name…"
            className="min-w-0 flex-1 rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-sm text-white outline-none focus:border-white/30"
          />
          <button
            onClick={handleAdd}
            disabled={newTier === 2 && !newParentId}
            className="flex-none rounded-md bg-emerald-500 px-3 py-1.5 text-sm font-medium text-black hover:bg-emerald-400 disabled:opacity-40"
          >
            + Add
          </button>
        </div>

        <div className="flex gap-1.5">
          <div className="flex flex-1 overflow-hidden rounded-md border border-white/10">
            <button
              onClick={() => setNewTier(1)}
              className={`flex-1 py-1 text-xs font-medium ${
                newTier === 1 ? "bg-white/15 text-white" : "text-white/50 hover:bg-white/5"
              }`}
            >
              Tier 1
            </button>
            <button
              onClick={() => setNewTier(2)}
              disabled={tier1Regions.length === 0}
              className={`flex-1 py-1 text-xs font-medium disabled:opacity-30 ${
                newTier === 2 ? "bg-white/15 text-white" : "text-white/50 hover:bg-white/5"
              }`}
            >
              Tier 2
            </button>
          </div>
          {newTier === 2 && (
            <select
              value={newParentId}
              onChange={(e) => setNewParentId(e.target.value)}
              className="flex-1 rounded-md border border-white/10 bg-white/5 px-2 text-xs text-white outline-none focus:border-white/30"
            >
              <option value="">Inside which Tier 1?</option>
              {tier1Regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          )}
        </div>
        {newTier === 2 && tier1Regions.length === 0 && (
          <div className="text-xs text-amber-400/80">Create a Tier 1 region first.</div>
        )}
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
          tier1Regions.map((region) => (
            <div key={region.id} className="space-y-2">
              <RegionRow region={region} />
              {tier2Regions
                .filter((child) => child.parentId === region.id)
                .map((child) => (
                  <RegionRow key={child.id} region={child} nested />
                ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
