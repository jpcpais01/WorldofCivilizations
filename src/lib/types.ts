export interface Photo {
  id: string;
  dataUrl: string;
  caption: string;
}

export type Tier = 1 | 2;

export interface Region {
  id: string;
  name: string;
  color: string;
  description: string;
  photos: Photo[];
  countryIds: string[];
  tier: Tier;
  /** Set only for tier-2 regions: the tier-1 region this one lives inside. */
  parentId: string | null;
  createdAt: number;
}

/** A hand-drawn shape that behaves like a paintable "country" on the map. */
export interface CustomBorder {
  id: string;
  name: string;
  /** Outline color, and fill tint when not assigned to a region. */
  color: string;
  /** Closed polygon, stored as [lon, lat] pairs. */
  points: [number, number][];
  createdAt: number;
}

export interface ExportedData {
  version: 2;
  exportedAt: string;
  regions: Region[];
  customBorders: CustomBorder[];
}
