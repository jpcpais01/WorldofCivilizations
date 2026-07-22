"use client";

import { useState } from "react";
import { useMapStore } from "@/lib/store";
import { DEFAULT_BORDER_COLOR } from "@/lib/palette";
import type { CustomBorder } from "@/lib/types";

function CustomBorderRow({ border }: { border: CustomBorder }) {
  const renameCustomBorder = useMapStore((s) => s.renameCustomBorder);
  const updateCustomBorderColor = useMapStore((s) => s.updateCustomBorderColor);
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
      <input
        type="color"
        value={border.color || DEFAULT_BORDER_COLOR}
        onChange={(e) => updateCustomBorderColor(border.id, e.target.value)}
        title="Border outline color"
        className="h-6 w-6 flex-none cursor-pointer rounded border border-white/20 bg-transparent p-0"
      />
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => renameCustomBorder(border.id, name)}
        className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none"
      />
      {(tier1 || tier2) && (
        <span className="flex flex-none items-center gap-0.5" title="Painted region(s)">
          {tier1 && (
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: tier1.color }} />
          )}
          {tier2 && (
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: tier2.color }} />
          )}
        </span>
      )}
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
