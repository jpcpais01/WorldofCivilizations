"use client";

import { useState } from "react";
import { useMapStore } from "@/lib/store";
import type { CustomBorder } from "@/lib/types";

function CustomBorderRow({ border }: { border: CustomBorder }) {
  const renameCustomBorder = useMapStore((s) => s.renameCustomBorder);
  const deleteCustomBorder = useMapStore((s) => s.deleteCustomBorder);
  const regions = useMapStore((s) => s.regions);
  const [name, setName] = useState(border.name);

  const tier1 = regions.find((r) => r.tier === 1 && r.countryIds.includes(border.id));
  const tier2 = regions.find((r) => r.tier === 2 && r.countryIds.includes(border.id));

  const handleDelete = () => {
    if (confirm(`Delete the "${border.name}" border shape?`)) {
      deleteCustomBorder(border.id);
    }
  };

  return (
    <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.02] px-2.5 py-2">
      <span
        className="h-3 w-3 flex-none rounded-sm border border-amber-300/60"
        style={{ backgroundColor: tier2?.color ?? tier1?.color ?? "transparent" }}
      />
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => renameCustomBorder(border.id, name)}
        className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none"
      />
      <button
        onClick={handleDelete}
        className="flex-none text-white/30 hover:text-red-400"
        aria-label={`Delete ${border.name}`}
      >
        ✕
      </button>
    </div>
  );
}

export default function CustomBorderPanel() {
  const customBorders = useMapStore((s) => s.customBorders);

  if (customBorders.length === 0) return null;

  return (
    <div className="border-t border-white/10 px-3 py-3">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/50">
        Custom Borders ({customBorders.length})
      </h2>
      <div className="max-h-48 space-y-1.5 overflow-y-auto">
        {customBorders.map((border) => (
          <CustomBorderRow key={border.id} border={border} />
        ))}
      </div>
    </div>
  );
}
