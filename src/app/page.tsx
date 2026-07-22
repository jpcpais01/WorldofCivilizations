"use client";

import { useMapStore } from "@/lib/store";
import Toolbar from "@/components/Toolbar";
import WorldMap from "@/components/WorldMap";
import RegionPanel from "@/components/RegionPanel";
import CountryInfoCard from "@/components/CountryInfoCard";
import CustomBorderPanel from "@/components/CustomBorderPanel";

export default function Home() {
  const hasHydrated = useMapStore((s) => s.hasHydrated);
  const sidebarOpen = useMapStore((s) => s.sidebarOpen);
  const setSidebarOpen = useMapStore((s) => s.setSidebarOpen);

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <Toolbar />
      <div className="relative flex flex-1 overflow-hidden">
        <main className="relative flex-1">
          {hasHydrated ? (
            <WorldMap />
          ) : (
            <div className="flex h-full items-center justify-center text-white/40">
              Loading map…
            </div>
          )}
        </main>

        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden
          />
        )}

        <aside
          className={`fixed inset-y-0 right-0 z-40 flex w-[85%] max-w-sm flex-none transform flex-col overflow-hidden border-l border-white/10 bg-[#0d1117] transition-transform duration-200 ease-out md:static md:z-auto md:w-[340px] md:max-w-none md:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex h-12 flex-none items-center justify-between border-b border-white/10 px-3 md:hidden">
            <span className="text-sm font-semibold text-white/80">Menu</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-md text-white/60 hover:bg-white/10 hover:text-white"
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>
          <div className="flex flex-1 flex-col overflow-hidden">
            <CountryInfoCard />
            <RegionPanel />
            <CustomBorderPanel />
          </div>
        </aside>
      </div>
    </div>
  );
}
