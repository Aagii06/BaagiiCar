"use client";

import { errorMessage, useToast } from "@/components/common/Toast";
import { uploadCatalogImage, type UploadFolder } from "@/lib/api/admin";
import { catalogImage } from "@/lib/api/config";
import { cn } from "@/lib/utils";
import { ImageUp, Loader2, RefreshCw, Trash2, Undo2 } from "lucide-react";
import { useState } from "react";

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

/**
 * Single image upload (dealer logo, profile photo): saves into `uploads/<folder>` and hands back
 * the file name for the row's column. Click or drop a file.
 */
export default function ImageInput({
  value,
  onChange,
  folder,
  label,
  hint,
  round,
}: {
  value: string;
  onChange: (v: string) => void;
  folder: UploadFolder;
  /** "Лого оруулах" */
  label: string;
  hint?: string;
  /** Round preview, cropped to fill (profile photos). */
  round?: boolean;
}) {
  const toast = useToast();
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  // The saved file can be missing on the server: then it's offered for adding, like an empty one.
  const [broken, setBroken] = useState<string | null>(null);
  const saved = catalogImage(value, folder);
  const preview = saved && saved !== broken ? saved : null;
  // The image the form opened with: after a new upload / delete, "Буцаах" brings it back.
  const [initial] = useState(value);
  const changed = value !== initial;
  const revert = (
    <button
      type="button"
      onClick={() => onChange(initial)}
      disabled={uploading}
      className="flex h-9 items-center gap-1.5 rounded-lg bg-muted px-3 text-[13px] font-bold disabled:opacity-60"
    >
      <Undo2 className="size-3.5" />
      Буцаах
    </button>
  );

  const upload = async (file: File | undefined) => {
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) return toast("PNG, JPG, WEBP эсвэл SVG зураг сонгоно уу", "error");
    setUploading(true);
    try {
      onChange(await uploadCatalogImage(folder, file));
    } catch (err) {
      toast(errorMessage(err), "error");
    } finally {
      setUploading(false);
    }
  };

  const fileInput = (
    <input
      type="file"
      accept={IMAGE_TYPES.join(",")}
      className="hidden"
      disabled={uploading}
      onChange={(e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        upload(file);
      }}
    />
  );
  const dropProps = {
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(true);
    },
    onDragLeave: () => setDragging(false),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      upload(e.dataTransfer.files?.[0]);
    },
  };

  if (!preview)
    return (
      <div className="space-y-2">
        <label
          {...dropProps}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border px-4 py-7 text-center transition hover:border-primary/50 hover:bg-primary-soft/40",
            dragging && "border-primary bg-primary-soft/60",
            uploading && "pointer-events-none opacity-60"
          )}
        >
          <span className="grid size-12 place-items-center rounded-full bg-primary-soft text-primary">
            {uploading ? <Loader2 className="size-5 animate-spin" /> : <ImageUp className="size-5" />}
          </span>
          <span className="text-sm font-bold">{uploading ? "Оруулж байна…" : label}</span>
          <span className="text-xs text-muted-foreground">Дарж сонгох эсвэл энд чирж оруулна · PNG, JPG, WEBP, SVG</span>
          {fileInput}
        </label>
        {changed && <div className="flex justify-end">{revert}</div>}
      </div>
    );

  return (
    <div {...dropProps} className={cn("flex items-center gap-4 rounded-2xl border border-border p-3 transition", dragging && "border-primary bg-primary-soft/40")}>
      <span className={cn("relative grid size-20 shrink-0 place-items-center overflow-hidden border border-border bg-white", round ? "rounded-full" : "rounded-xl")}>
        {/* eslint-disable-next-line @next/next/no-img-element -- uploaded image */}
        <img src={preview} alt="" onError={() => setBroken(preview)} className={cn("size-full", round ? "object-cover" : "object-contain p-1.5")} />
        {uploading && (
          <span className="absolute inset-0 grid place-items-center bg-white/70">
            <Loader2 className="size-5 animate-spin text-primary" />
          </span>
        )}
      </span>
      <div className="min-w-0 flex-1 space-y-2">
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        <div className="flex gap-2">
          <label className={cn("flex h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-primary-soft px-3 text-[13px] font-bold text-primary", uploading && "pointer-events-none opacity-60")}>
            <RefreshCw className="size-3.5" />
            Солих
            {fileInput}
          </label>
          {changed ? (
            revert
          ) : (
            <button
              type="button"
              onClick={() => onChange("")}
              disabled={uploading}
              className="flex h-9 items-center gap-1.5 rounded-lg bg-destructive-soft px-3 text-[13px] font-bold text-destructive disabled:opacity-60"
            >
              <Trash2 className="size-3.5" />
              Устгах
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
