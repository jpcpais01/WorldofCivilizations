import { useMapStore } from "@/lib/store";
import { getCountryName } from "@/lib/countries";

export function isCustomBorderId(id: string): boolean {
  return id.startsWith("cb-");
}

/** Resolves a display name for any paintable entity id: real country or custom-drawn border. */
export function useEntityName() {
  const customBorders = useMapStore((s) => s.customBorders);
  return (id: string): string => {
    if (isCustomBorderId(id)) {
      return customBorders.find((b) => b.id === id)?.name ?? "Custom border";
    }
    return getCountryName(id);
  };
}
