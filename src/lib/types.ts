export interface Photo {
  id: string;
  dataUrl: string;
  caption: string;
}

export interface Region {
  id: string;
  name: string;
  color: string;
  description: string;
  photos: Photo[];
  countryIds: string[];
  createdAt: number;
}

export interface ExportedData {
  version: 1;
  exportedAt: string;
  regions: Region[];
}
