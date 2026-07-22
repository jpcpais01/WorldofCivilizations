"use client";

import { useState } from "react";
import { useMapStore } from "@/lib/store";
import { DEFAULT_BORDER_COLOR } from "@/lib/palette";
import type { CustomBorder } from "@/lib/types";

function CustomBorderRow({ border }: { border: CustomBorder }) {
  const renameCustomBorder = useMapStore((s) => s.renameCustomBorder);
  const updateCustomBorderColor = useMapStore((s) => s.updateCustomBorderColor);
  const deleteCustomBorder = useMapStore((s) => s.deleteCustomBorder);
  const [name, setName] = useState(border.name);

  const handleDelete = () => {
    if (confirm(`Delete the "${border.name}" border line?`)) {
      deleteCustomBorder(border.id);
    }
  };

  return (
    <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.02] px-2.5 py-2">
      <input
        type="color"
        value={border.color || DEFAULT_BORDER_COLOR}
        onChange={(e) => updateCustomBorderColor(border.id, e.target.value)}
        title="Border line color"
        className="h-6 w-6 flex-none cursor-pointer rounded border border-white/20 bg-transparent p-0"
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
        Border Lines ({customBorders.length})
      </h2>
      <p className="mb-2 text-xs text-white/40">
        Drawn lines split whichever countries they cross, so you can paint just one side.
      </p>
      <div className="max-h-48 space-y-1.5 overflow-y-auto">
        {customBorders.map((border) => (
          <CustomBorderRow key={border.id} border={border} />
        ))}
      </div>
    </div>
  );
}
