"use client";

import { useRef, useState } from "react";
import { useMapStore } from "@/lib/store";
import { fileToCompressedDataUrl } from "@/lib/image";
import type { Photo } from "@/lib/types";

export default function PhotoGallery({ regionId, photos }: { regionId: string; photos: Photo[] }) {
  const addPhoto = useMapStore((s) => s.addPhoto);
  const removePhoto = useMapStore((s) => s.removePhoto);
  const updatePhotoCaption = useMapStore((s) => s.updatePhotoCaption);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        if (!file.type.startsWith("image/")) continue;
        const dataUrl = await fileToCompressedDataUrl(file);
        addPhoto(regionId, { dataUrl, caption: "" });
      }
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium uppercase tracking-wide text-white/40">
          Photos ({photos.length})
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="rounded-md bg-white/10 px-2.5 py-1 text-xs text-white/80 hover:bg-white/20 disabled:opacity-50"
        >
          {uploading ? "Uploading…" : "+ Add photos"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFiles}
        />
      </div>

      {photos.length > 0 && (
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {photos.map((p) => (
            <button
              key={p.id}
              onClick={() => setLightboxPhoto(p)}
              className="group relative aspect-square overflow-hidden rounded-md border border-white/10 bg-black/30"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.dataUrl}
                alt={p.caption || "Region photo"}
                className="h-full w-full object-cover transition group-hover:scale-105"
              />
            </button>
          ))}
        </div>
      )}

      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-3 sm:p-6"
          onClick={() => setLightboxPhoto(null)}
        >
          <div
            className="max-h-full w-full max-w-2xl overflow-hidden rounded-lg bg-[#161b22] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxPhoto.dataUrl}
              alt={lightboxPhoto.caption || "Region photo"}
              className="max-h-[55vh] w-full object-contain bg-black sm:max-h-[70vh]"
            />
            <div className="flex flex-wrap items-center gap-2 p-2.5 sm:p-3">
              <input
                value={lightboxPhoto.caption}
                onChange={(e) => {
                  const caption = e.target.value;
                  setLightboxPhoto({ ...lightboxPhoto, caption });
                  updatePhotoCaption(regionId, lightboxPhoto.id, caption);
                }}
                placeholder="Add a caption…"
                className="min-w-[140px] flex-1 rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-sm text-white outline-none focus:border-white/30"
              />
              <button
                onClick={() => {
                  removePhoto(regionId, lightboxPhoto.id);
                  setLightboxPhoto(null);
                }}
                className="flex-none rounded-md bg-red-500/10 px-2.5 py-1.5 text-sm text-red-400 hover:bg-red-500/20"
              >
                Delete
              </button>
              <button
                onClick={() => setLightboxPhoto(null)}
                className="flex-none rounded-md bg-white/10 px-2.5 py-1.5 text-sm text-white/80 hover:bg-white/20"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
