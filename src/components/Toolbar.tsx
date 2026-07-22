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
  const toggleSidebar = useMapStore((s) => s.toggleSidebar);

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
    <header className="flex flex-none flex-col border-b border-white/10 bg-[#0d1117]">
      {/* Row 1: branding, sidebar toggle (mobile), global actions */}
      <div className="flex h-12 items-center gap-1.5 px-2.5 sm:h-14 sm:gap-2 sm:px-4">
        <button
          onClick={toggleSidebar}
          className="flex h-8 w-8 flex-none items-center justify-center rounded-md text-lg text-white/80 hover:bg-white/10 md:hidden"
          aria-label="Open menu"
        >
          ☰
        </button>

        <span className="text-lg sm:text-xl">🌍</span>
        <h1 className="whitespace-nowrap text-sm font-semibold text-white/90">World Painter</h1>

        <div className="flex-1" />

        <button
          onClick={handleImportClick}
          title="Import"
          className="flex h-8 w-8 flex-none items-center justify-center rounded-md text-base text-white/70 hover:bg-white/10 hover:text-white sm:h-auto sm:w-auto sm:px-3 sm:py-1.5 sm:text-sm"
        >
          <span className="sm:hidden" aria-hidden>📥</span>
          <span className="hidden sm:inline">Import</span>
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
          title="Export"
          className="flex h-8 w-8 flex-none items-center justify-center rounded-md text-base text-white/70 hover:bg-white/10 hover:text-white sm:h-auto sm:w-auto sm:px-3 sm:py-1.5 sm:text-sm"
        >
          <span className="sm:hidden" aria-hidden>📤</span>
          <span className="hidden sm:inline">Export</span>
        </button>
        <button
          onClick={handleReset}
          title="Reset"
          className="flex h-8 w-8 flex-none items-center justify-center rounded-md text-base text-red-400/80 hover:bg-red-500/10 hover:text-red-400 sm:h-auto sm:w-auto sm:px-3 sm:py-1.5 sm:text-sm"
        >
          <span className="sm:hidden" aria-hidden>🗑️</span>
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>

      {/* Row 2: mode controls - scrolls horizontally instead of wrapping on narrow screens */}
      <div className="relative border-t border-white/5">
      <div className="flex items-center gap-2 overflow-x-auto px-2.5 py-2 sm:px-4">
        <button
          onClick={togglePaintMode}
          disabled={drawMode}
          className={`flex-none rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition disabled:opacity-40 ${
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
              className={`flex-none rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition ${
                eraseMode
                  ? "bg-red-500 text-black hover:bg-red-400"
                  : "bg-white/10 text-white/80 hover:bg-white/20"
              }`}
            >
              {eraseMode ? "✓ Erasing" : "Erase"}
            </button>

            <div className="flex flex-none items-center gap-2 text-sm whitespace-nowrap text-white/70">
              {eraseMode ? (
                <span>Tap countries or borders to unassign</span>
              ) : activeRegion ? (
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-3 w-3 flex-none rounded-full border border-white/30"
                    style={{ backgroundColor: activeRegion.color }}
                  />
                  <strong className="text-white">{activeRegion.name}</strong>
                  <span className="flex-none rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-white/50">
                    T{activeRegion.tier}
                  </span>
                </span>
              ) : (
                <span className="text-amber-400">Pick a region in the menu to paint with</span>
              )}
            </div>
          </>
        )}

        <div className="mx-0.5 h-6 w-px flex-none bg-white/10" />

        <button
          onClick={() => setDrawMode(!drawMode)}
          className={`flex-none rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition ${
            drawMode
              ? "bg-amber-400 text-black hover:bg-amber-300"
              : "bg-white/10 text-white/80 hover:bg-white/20"
          }`}
        >
          {drawMode ? "✓ Drawing" : "Draw Border"}
        </button>

        {drawMode && (
          <div className="flex flex-none items-center gap-2">
            <span className="whitespace-nowrap text-sm text-white/60">
              {drawPoints.length} pt{drawPoints.length === 1 ? "" : "s"}
            </span>
            <button
              onClick={undoDrawPoint}
              disabled={drawPoints.length === 0}
              className="flex-none rounded-md bg-white/10 px-2.5 py-1 text-sm whitespace-nowrap text-white/80 hover:bg-white/20 disabled:opacity-40"
            >
              Undo
            </button>
            <button
              onClick={handleFinishDrawing}
              disabled={drawPoints.length < 3}
              className="flex-none rounded-md bg-emerald-500 px-2.5 py-1 text-sm font-medium whitespace-nowrap text-black hover:bg-emerald-400 disabled:opacity-40"
            >
              Finish
            </button>
            <button
              onClick={handleCancelDrawing}
              className="flex-none rounded-md px-2.5 py-1 text-sm whitespace-nowrap text-red-400/80 hover:bg-red-500/10 hover:text-red-400"
            >
              Cancel
            </button>
            <input
              value={borderName}
              onChange={(e) => setBorderName(e.target.value)}
              placeholder="Border name…"
              className="w-28 flex-none rounded-md border border-white/10 bg-white/5 px-2 py-1 text-sm text-white outline-none focus:border-white/30 sm:w-36"
            />
          </div>
        )}
      </div>
      <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-[#0d1117] to-transparent" />
      </div>
    </header>
  );
}
