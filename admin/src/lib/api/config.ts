export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5011").replace(/\/$/, "");

/** Car photos live under `<backend>/uploads/cars`, in four widths. */
export type ImageSize = "icon" | "thumb" | "grid" | "full";

export function uploadUrl(fileName: string | null | undefined, size: ImageSize = "full", folder = "cars") {
  if (!fileName) return null;
  if (/^https?:\/\//.test(fileName)) return fileName;
  const prefix = size === "full" ? "" : `${size}_`;
  return `${API_BASE_URL}/uploads/${folder}/${prefix}${fileName}`;
}

/** Brand logos / body-type icons: the DB keeps only the file name, stored in `<backend>/uploads/<folder>`; absolute URLs pass through. */
export function catalogImage(fileName: string | null | undefined, folder: "brands" | "bodyTypes" | "users" | "dealers") {
  return uploadUrl(fileName?.trim(), "full", folder);
}

/** Public site, for "open on site" links. */
export const WEB_URL = (process.env.NEXT_PUBLIC_WEB_URL ?? "").replace(/\/$/, "");
