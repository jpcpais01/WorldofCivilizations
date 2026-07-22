import { useMapStore } from "@/lib/store";
import { getCountryName } from "@/lib/countries";
import { isSplitPieceId, splitPieceCountryKey } from "@/lib/splitCountries";

function splitPieceIndex(id: string): number {
  const match = id.match(/::(\d+)$/);
  return match ? Number(match[1]) : 0;
}

export function isCustomBorderId(id: string): boolean {
  return id.startsWith("cb-");
}

/** Resolves a display name for any paintable entity id: a real country, or a
 * piece of one that's been cut by a custom border line. */
export function useEntityName() {
  const customBorders = useMapStore((s) => s.customBorders);
  return (id: string): string => {
    if (isCustomBorderId(id)) {
      return customBorders.find((b) => b.id === id)?.name ?? "Custom border";
    }
    if (isSplitPieceId(id)) {
      return `${getCountryName(splitPieceCountryKey(id))} · part ${splitPieceIndex(id) + 1}`;
    }
    return getCountryName(id);
  };
}
