"use client";

import { useMapStore } from "@/lib/store";
import Toolbar from "@/components/Toolbar";
import WorldMap from "@/components/WorldMap";
import RegionPanel from "@/components/RegionPanel";
import CountryInfoCard from "@/components/CountryInfoCard";
import CustomBorderPanel from "@/components/CustomBorderPanel";

export default function Home() {
  const hasHydrated = useMapStore((s) => s.hasHydrated);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Toolbar />
      <div className="flex flex-1 overflow-hidden">
        <main className="relative flex-1">
          {hasHydrated ? (
            <WorldMap />
          ) : (
            <div className="flex h-full items-center justify-center text-white/40">
              Loading map…
            </div>
          )}
        </main>
        <aside className="flex w-[340px] flex-none flex-col overflow-hidden border-l border-white/10 bg-[#0d1117]">
          <CountryInfoCard />
          <RegionPanel />
          <CustomBorderPanel />
        </aside>
      </div>
    </div>
  );
}
