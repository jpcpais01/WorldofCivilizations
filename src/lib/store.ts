import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { v4 as uuid } from "uuid";
import { idbStorage } from "@/lib/idbStorage";
import { nextPaletteColor } from "@/lib/palette";
import type { ExportedData, Photo, Region } from "@/lib/types";

interface MapStore {
  regions: Region[];
  activeRegionId: string | null;
  paintMode: boolean;
  eraseMode: boolean;
  selectedCountryId: string | null;
  hasHydrated: boolean;

  setHasHydrated: (v: boolean) => void;
  addRegion: (name: string, color?: string) => string;
  updateRegion: (id: string, patch: Partial<Pick<Region, "name" | "color" | "description">>) => void;
  deleteRegion: (id: string) => void;
  setActiveRegion: (id: string | null) => void;
  togglePaintMode: () => void;
  setEraseMode: (v: boolean) => void;
  setSelectedCountry: (id: string | null) => void;
  paintCountry: (countryId: string) => void;
  unassignCountry: (countryId: string) => void;
  addPhoto: (regionId: string, photo: Omit<Photo, "id">) => void;
  removePhoto: (regionId: string, photoId: string) => void;
  updatePhotoCaption: (regionId: string, photoId: string, caption: string) => void;
  regionForCountry: (countryId: string) => Region | undefined;
  exportData: () => string;
  importData: (json: string) => { ok: boolean; error?: string };
  resetAll: () => void;
}

export const useMapStore = create<MapStore>()(
  persist(
    (set, get) => ({
      regions: [],
      activeRegionId: null,
      paintMode: false,
      eraseMode: false,
      selectedCountryId: null,
      hasHydrated: false,

      setHasHydrated: (v) => set({ hasHydrated: v }),

      addRegion: (name, color) => {
        const id = uuid();
        const usedColors = get().regions.map((r) => r.color);
        const region: Region = {
          id,
          name: name.trim() || "Untitled Region",
          color: color || nextPaletteColor(usedColors),
          description: "",
          photos: [],
          countryIds: [],
          createdAt: Date.now(),
        };
        set((s) => ({ regions: [...s.regions, region], activeRegionId: id }));
        return id;
      },

      updateRegion: (id, patch) =>
        set((s) => ({
          regions: s.regions.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        })),

      deleteRegion: (id) =>
        set((s) => ({
          regions: s.regions.filter((r) => r.id !== id),
          activeRegionId: s.activeRegionId === id ? null : s.activeRegionId,
        })),

      setActiveRegion: (id) => set({ activeRegionId: id }),

      togglePaintMode: () => set((s) => ({ paintMode: !s.paintMode })),

      setEraseMode: (v) => set({ eraseMode: v }),

      setSelectedCountry: (id) => set({ selectedCountryId: id }),

      paintCountry: (countryId) => {
        const { activeRegionId, eraseMode } = get();
        if (eraseMode) {
          get().unassignCountry(countryId);
          return;
        }
        if (!activeRegionId) return;
        set((s) => ({
          regions: s.regions.map((r) => {
            if (r.id === activeRegionId) {
              if (r.countryIds.includes(countryId)) return r;
              return { ...r, countryIds: [...r.countryIds, countryId] };
            }
            return r.countryIds.includes(countryId)
              ? { ...r, countryIds: r.countryIds.filter((c) => c !== countryId) }
              : r;
          }),
        }));
      },

      unassignCountry: (countryId) =>
        set((s) => ({
          regions: s.regions.map((r) =>
            r.countryIds.includes(countryId)
              ? { ...r, countryIds: r.countryIds.filter((c) => c !== countryId) }
              : r
          ),
        })),

      addPhoto: (regionId, photo) =>
        set((s) => ({
          regions: s.regions.map((r) =>
            r.id === regionId
              ? { ...r, photos: [...r.photos, { ...photo, id: uuid() }] }
              : r
          ),
        })),

      removePhoto: (regionId, photoId) =>
        set((s) => ({
          regions: s.regions.map((r) =>
            r.id === regionId
              ? { ...r, photos: r.photos.filter((p) => p.id !== photoId) }
              : r
          ),
        })),

      updatePhotoCaption: (regionId, photoId, caption) =>
        set((s) => ({
          regions: s.regions.map((r) =>
            r.id === regionId
              ? {
                  ...r,
                  photos: r.photos.map((p) =>
                    p.id === photoId ? { ...p, caption } : p
                  ),
                }
              : r
          ),
        })),

      regionForCountry: (countryId) =>
        get().regions.find((r) => r.countryIds.includes(countryId)),

      exportData: () => {
        const data: ExportedData = {
          version: 1,
          exportedAt: new Date().toISOString(),
          regions: get().regions,
        };
        return JSON.stringify(data, null, 2);
      },

      importData: (json) => {
        try {
          const parsed = JSON.parse(json) as ExportedData;
          if (!parsed || !Array.isArray(parsed.regions)) {
            return { ok: false, error: "File does not look like a valid export." };
          }
          set({ regions: parsed.regions, activeRegionId: null });
          return { ok: true };
        } catch {
          return { ok: false, error: "Could not parse JSON file." };
        }
      },

      resetAll: () => set({ regions: [], activeRegionId: null, selectedCountryId: null }),
    }),
    {
      name: "world-painter-storage",
      storage: createJSONStorage(() => idbStorage),
      partialize: (s) => ({ regions: s.regions }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
