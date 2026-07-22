"use client";

import { useRef, useState } from "react";
import { useMapStore } from "@/lib/store";

export default function Toolbar() {
  const paintMode = useMapStore((s) => s.paintMode);
  const eraseMode = useMapStore((s) => s.eraseMode);
  const drawMode = useMapStore((s) => s.drawMode);
  const drawPoints = useMapStore((s) => s.drawPoints);
  const activeRegionId = useMapStore((s) => s.activeRegionId);
  const regions = useMapStore((s) => s.regions);
  const togglePaintMode = useMapStore((s) => s.togglePaintMode);
  const setEraseMode = useMapStore((s) => s.setEraseMode);
  const setDrawMode = useMapStore((s) => s.setDrawMode);
  const undoDrawPoint = useMapStore((s) => s.undoDrawPoint);
  const cancelDrawing = useMapStore((s) => s.cancelDrawing);
  const finishDrawing = useMapStore((s) => s.finishDrawing);
  const exportData = useMapStore((s) => s.exportData);
  const importData = useMapStore((s) => s.importData);
  const resetAll = useMapStore((s) => s.resetAll);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeRegion = regions.find((r) => r.id === activeRegionId);
  const [borderName, setBorderName] = useState("");

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
    if (confirm("Erase all regions, custom borders, paint, and photos? This cannot be undone.")) {
      resetAll();
    }
  };

  const handleFinishDrawing = () => {
    finishDrawing(borderName);
    setBorderName("");
  };

  const handleCancelDrawing = () => {
    cancelDrawing();
    setBorderName("");
  };

  return (
    <header className="flex h-14 flex-none flex-wrap items-center gap-3 border-b border-white/10 bg-[#0d1117] px-4">
      <div className="flex items-center gap-2">
        <span className="text-xl">🌍</span>
        <h1 className="text-sm font-semibold text-white/90">World Painter</h1>
      </div>

      <div className="mx-3 h-6 w-px bg-white/10" />

      <button
        onClick={togglePaintMode}
        disabled={drawMode}
        className={`rounded-md px-3 py-1.5 text-sm font-medium transition disabled:opacity-40 ${
          paintMode
            ? "bg-emerald-500 text-black hover:bg-emerald-400"
            : "bg-white/10 text-white/80 hover:bg-white/20"
        }`}
      >
        {paintMode ? "✓ Painting" : "Paint Mode"}
      </button>

      {paintMode && !drawMode && (
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
              <span>Click countries or borders to unassign them</span>
            ) : activeRegion ? (
              <span className="flex items-center gap-1.5">
                Painting
                <span
                  className="inline-block h-3 w-3 rounded-full border border-white/30"
                  style={{ backgroundColor: activeRegion.color }}
                />
                <strong className="text-white">{activeRegion.name}</strong>
                <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-white/50">
                  Tier {activeRegion.tier}
                </span>
              </span>
            ) : (
              <span className="text-amber-400">Select a region in the sidebar to paint with</span>
            )}
          </div>
        </>
      )}

      <div className="mx-1 h-6 w-px bg-white/10" />

      <button
        onClick={() => setDrawMode(!drawMode)}
        className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
          drawMode
            ? "bg-amber-400 text-black hover:bg-amber-300"
            : "bg-white/10 text-white/80 hover:bg-white/20"
        }`}
      >
        {drawMode ? "✓ Drawing" : "Draw Border"}
      </button>

      {drawMode && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/60">
            {drawPoints.length} point{drawPoints.length === 1 ? "" : "s"}
          </span>
          <input
            value={borderName}
            onChange={(e) => setBorderName(e.target.value)}
            placeholder="Border name…"
            className="w-36 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-sm text-white outline-none focus:border-white/30"
          />
          <button
            onClick={undoDrawPoint}
            disabled={drawPoints.length === 0}
            className="rounded-md bg-white/10 px-2.5 py-1 text-sm text-white/80 hover:bg-white/20 disabled:opacity-40"
          >
            Undo
          </button>
          <button
            onClick={handleFinishDrawing}
            disabled={drawPoints.length < 3}
            className="rounded-md bg-emerald-500 px-2.5 py-1 text-sm font-medium text-black hover:bg-emerald-400 disabled:opacity-40"
          >
            Finish
          </button>
          <button
            onClick={handleCancelDrawing}
            className="rounded-md px-2.5 py-1 text-sm text-red-400/80 hover:bg-red-500/10 hover:text-red-400"
          >
            Cancel
          </button>
        </div>
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
