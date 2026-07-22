"use client";

import { useRef } from "react";
import { useMapStore } from "@/lib/store";

export default function Toolbar() {
  const paintMode = useMapStore((s) => s.paintMode);
  const eraseMode = useMapStore((s) => s.eraseMode);
  const activeRegionId = useMapStore((s) => s.activeRegionId);
  const regions = useMapStore((s) => s.regions);
  const togglePaintMode = useMapStore((s) => s.togglePaintMode);
  const setEraseMode = useMapStore((s) => s.setEraseMode);
  const exportData = useMapStore((s) => s.exportData);
  const importData = useMapStore((s) => s.importData);
  const resetAll = useMapStore((s) => s.resetAll);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeRegion = regions.find((r) => r.id === activeRegionId);

  const handleExport = () => {
    const json = exportData();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `world-regions-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const result = importData(text);
    if (!result.ok) {
      alert(result.error || "Import failed.");
    }
    e.target.value = "";
  };

  const handleReset = () => {
    if (confirm("Erase all regions, paint, and photos? This cannot be undone.")) {
      resetAll();
    }
  };

  return (
    <header className="flex h-14 flex-none items-center gap-3 border-b border-white/10 bg-[#0d1117] px-4">
      <div className="flex items-center gap-2">
        <span className="text-xl">🌍</span>
        <h1 className="text-sm font-semibold text-white/90">World Painter</h1>
      </div>

      <div className="mx-3 h-6 w-px bg-white/10" />

      <button
        onClick={togglePaintMode}
        className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
          paintMode
            ? "bg-emerald-500 text-black hover:bg-emerald-400"
            : "bg-white/10 text-white/80 hover:bg-white/20"
        }`}
      >
        {paintMode ? "✓ Painting" : "Paint Mode"}
      </button>

      {paintMode && (
        <>
          <button
            onClick={() => setEraseMode(!eraseMode)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              eraseMode
                ? "bg-red-500 text-black hover:bg-red-400"
                : "bg-white/10 text-white/80 hover:bg-white/20"
            }`}
          >
            {eraseMode ? "✓ Erasing" : "Erase"}
          </button>

          <div className="flex items-center gap-2 text-sm text-white/70">
            {eraseMode ? (
              <span>Click countries to unassign them</span>
            ) : activeRegion ? (
              <span className="flex items-center gap-1.5">
                Painting
                <span
                  className="inline-block h-3 w-3 rounded-full border border-white/30"
                  style={{ backgroundColor: activeRegion.color }}
                />
                <strong className="text-white">{activeRegion.name}</strong>
              </span>
            ) : (
              <span className="text-amber-400">Select a region in the sidebar to paint with</span>
            )}
          </div>
        </>
      )}

      <div className="flex-1" />

      <button
        onClick={handleImportClick}
        className="rounded-md px-3 py-1.5 text-sm text-white/70 hover:bg-white/10 hover:text-white"
      >
        Import
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={handleImportFile}
      />
      <button
        onClick={handleExport}
        className="rounded-md px-3 py-1.5 text-sm text-white/70 hover:bg-white/10 hover:text-white"
      >
        Export
      </button>
      <button
        onClick={handleReset}
        className="rounded-md px-3 py-1.5 text-sm text-red-400/80 hover:bg-red-500/10 hover:text-red-400"
      >
        Reset
      </button>
    </header>
  );
}
