import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { v4 as uuid } from "uuid";
import { idbStorage } from "@/lib/idbStorage";
import { nextPaletteColor, DEFAULT_BORDER_COLOR } from "@/lib/palette";
import type { CustomBorder, ExportedData, Photo, Region, Tier } from "@/lib/types";

interface AddRegionOptions {
  tier?: Tier;
  parentId?: string | null;
  color?: string;
}

interface MapStore {
  regions: Region[];
  customBorders: CustomBorder[];
  activeRegionId: string | null;
  paintMode: boolean;
  eraseMode: boolean;
  drawMode: boolean;
  drawPoints: [number, number][];
  selectedCountryId: string | null;
  hasHydrated: boolean;
  sidebarOpen: boolean;

  setHasHydrated: (v: boolean) => void;
  setSidebarOpen: (v: boolean) => void;
  toggleSidebar: () => void;
  addRegion: (name: string, opts?: AddRegionOptions) => string;
  updateRegion: (id: string, patch: Partial<Pick<Region, "name" | "color" | "description">>) => void;
  deleteRegion: (id: string) => void;
  setActiveRegion: (id: string | null) => void;
  togglePaintMode: () => void;
  setEraseMode: (v: boolean) => void;
  setSelectedCountry: (id: string | null) => void;

  /** Works for any paintable entity id: a real country or a custom-drawn border. */
  paintCountry: (countryId: string) => void;
  unassignCountry: (countryId: string) => void;
  unassignFromRegion: (countryId: string, regionId: string) => void;
  regionsForCountry: (countryId: string) => { tier1?: Region; tier2?: Region };

  setDrawMode: (v: boolean) => void;
  addDrawPoint: (lonLat: [number, number]) => void;
  undoDrawPoint: () => void;
  cancelDrawing: () => void;
  finishDrawing: (name?: string) => void;
  renameCustomBorder: (id: string, name: string) => void;
  updateCustomBorderColor: (id: string, color: string) => void;
  deleteCustomBorder: (id: string) => void;

  addPhoto: (regionId: string, photo: Omit<Photo, "id">) => void;
  removePhoto: (regionId: string, photoId: string) => void;
  updatePhotoCaption: (regionId: string, photoId: string, caption: string) => void;
  exportData: () => string;
  importData: (json: string) => { ok: boolean; error?: string };
  resetAll: () => void;
}

export const useMapStore = create<MapStore>()(
  persist(
    (set, get) => ({
      regions: [],
      customBorders: [],
      activeRegionId: null,
      paintMode: false,
      eraseMode: false,
      drawMode: false,
      drawPoints: [],
      selectedCountryId: null,
      hasHydrated: false,
      sidebarOpen: false,

      setHasHydrated: (v) => set({ hasHydrated: v }),
      setSidebarOpen: (v) => set({ sidebarOpen: v }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

      addRegion: (name, opts) => {
        const id = uuid();
        const tier = opts?.tier ?? 1;
        const parentId = tier === 2 ? opts?.parentId ?? null : null;
        const usedColors = get().regions.map((r) => r.color);
        const region: Region = {
          id,
          name: name.trim() || "Untitled Region",
          color: opts?.color || nextPaletteColor(usedColors),
          description: "",
          photos: [],
          countryIds: [],
          tier,
          parentId,
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
        set((s) => {
          // Deleting a tier-1 region cascades to its tier-2 children.
          const toDelete = new Set([id, ...s.regions.filter((r) => r.parentId === id).map((r) => r.id)]);
          return {
            regions: s.regions.filter((r) => !toDelete.has(r.id)),
            activeRegionId: s.activeRegionId && toDelete.has(s.activeRegionId) ? null : s.activeRegionId,
          };
        }),

      setActiveRegion: (id) => set({ activeRegionId: id }),

      togglePaintMode: () => set((s) => ({ paintMode: !s.paintMode, drawMode: false })),

      setEraseMode: (v) => set({ eraseMode: v }),

      setSelectedCountry: (id) => set({ selectedCountryId: id }),

      paintCountry: (countryId) => {
        const { activeRegionId, eraseMode, regions } = get();
        if (eraseMode) {
          get().unassignCountry(countryId);
          return;
        }
        if (!activeRegionId) return;
        const active = regions.find((r) => r.id === activeRegionId);
        if (!active) return;

        set((s) => ({
          regions: s.regions.map((r) => {
            if (r.id === active.id) {
              return r.countryIds.includes(countryId)
                ? r
                : { ...r, countryIds: [...r.countryIds, countryId] };
            }
            // A country can hold one tier-1 and one tier-2 region at once;
            // painting one clears any other region at the same tier.
            if (r.tier === active.tier && r.countryIds.includes(countryId)) {
              return { ...r, countryIds: r.countryIds.filter((c) => c !== countryId) };
            }
            return r;
          }),
        }));

        // Painting a tier-2 region nests it inside its parent tier-1 region
        // automatically, unless the country already belongs to a different one.
        if (active.tier === 2 && active.parentId) {
          const hasTier1 = get().regions.some((r) => r.tier === 1 && r.countryIds.includes(countryId));
          if (!hasTier1) {
            const parentId = active.parentId;
            set((s) => ({
              regions: s.regions.map((r) =>
                r.id === parentId && !r.countryIds.includes(countryId)
                  ? { ...r, countryIds: [...r.countryIds, countryId] }
                  : r
              ),
            }));
          }
        }
      },

      unassignCountry: (countryId) =>
        set((s) => ({
          regions: s.regions.map((r) =>
            r.countryIds.includes(countryId)
              ? { ...r, countryIds: r.countryIds.filter((c) => c !== countryId) }
              : r
          ),
        })),

      unassignFromRegion: (countryId, regionId) =>
        set((s) => ({
          regions: s.regions.map((r) =>
            r.id === regionId ? { ...r, countryIds: r.countryIds.filter((c) => c !== countryId) } : r
          ),
        })),

      regionsForCountry: (countryId) => ({
        tier1: get().regions.find((r) => r.tier === 1 && r.countryIds.includes(countryId)),
        tier2: get().regions.find((r) => r.tier === 2 && r.countryIds.includes(countryId)),
      }),

      setDrawMode: (v) =>
        set((s) => ({ drawMode: v, drawPoints: v ? [] : s.drawPoints, paintMode: v ? false : s.paintMode })),

      addDrawPoint: (lonLat) => set((s) => ({ drawPoints: [...s.drawPoints, lonLat] })),

      undoDrawPoint: () => set((s) => ({ drawPoints: s.drawPoints.slice(0, -1) })),

      cancelDrawing: () => set({ drawPoints: [], drawMode: false }),

      finishDrawing: (name) => {
        const points = get().drawPoints;
        if (points.length < 2) return;
        const border: CustomBorder = {
          id: `cb-${uuid()}`,
          name: name?.trim() || `Custom Border ${get().customBorders.length + 1}`,
          color: DEFAULT_BORDER_COLOR,
          points,
          createdAt: Date.now(),
        };
        set((s) => ({ customBorders: [...s.customBorders, border], drawPoints: [], drawMode: false }));
      },

      renameCustomBorder: (id, name) =>
        set((s) => ({
          customBorders: s.customBorders.map((b) => (b.id === id ? { ...b, name: name.trim() || b.name } : b)),
        })),

      updateCustomBorderColor: (id, color) =>
        set((s) => ({
          customBorders: s.customBorders.map((b) => (b.id === id ? { ...b, color } : b)),
        })),

      deleteCustomBorder: (id) =>
        set((s) => ({
          customBorders: s.customBorders.filter((b) => b.id !== id),
          regions: s.regions.map((r) =>
            r.countryIds.includes(id) ? { ...r, countryIds: r.countryIds.filter((c) => c !== id) } : r
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

      exportData: () => {
        const data: ExportedData = {
          version: 2,
          exportedAt: new Date().toISOString(),
          regions: get().regions,
          customBorders: get().customBorders,
        };
        return JSON.stringify(data, null, 2);
      },

      importData: (json) => {
        try {
          const parsed = JSON.parse(json) as Partial<ExportedData>;
          if (!parsed || !Array.isArray(parsed.regions)) {
            return { ok: false, error: "File does not look like a valid export." };
          }
          const regions: Region[] = parsed.regions.map((r) => ({
            ...r,
            tier: r.tier === 2 ? 2 : 1,
            parentId: r.tier === 2 ? r.parentId ?? null : null,
          }));
          const customBorders: CustomBorder[] = Array.isArray(parsed.customBorders)
            ? parsed.customBorders.map((b) => ({ ...b, color: b.color || DEFAULT_BORDER_COLOR }))
            : [];
          set({ regions, customBorders, activeRegionId: null });
          return { ok: true };
        } catch {
          return { ok: false, error: "Could not parse JSON file." };
        }
      },

      resetAll: () =>
        set({
          regions: [],
          customBorders: [],
          activeRegionId: null,
          selectedCountryId: null,
          drawMode: false,
          drawPoints: [],
        }),
    }),
    {
      name: "world-painter-storage",
      storage: createJSONStorage(() => idbStorage),
      partialize: (s) => ({ regions: s.regions, customBorders: s.customBorders }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
