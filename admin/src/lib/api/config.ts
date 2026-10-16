export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5008").replace(/\/$/, "");

/** Car photos live under `<backend>/uploads/cars`, in four widths. */
export type ImageSize = "icon" | "thumb" | "grid" | "full";

export function uploadUrl(fileName: string | null | undefined, size: ImageSize = "full", folder = "cars") {
  if (!fileName) return null;
  if (/^https?:\/\//.test(fileName)) return fileName;
  const prefix = size === "full" ? "" : `${size}_`;
  return `${API_BASE_URL}/uploads/${folder}/${prefix}${fileName}`;
}

/** Brand logos / body-type icons are seeded as absolute URLs; anything else is skipped. */
export function remoteImage(url: string | null | undefined) {
  return url && /^https?:\/\//.test(url) ? url : null;
}

/** Public site, for "open on site" links. */
export const WEB_URL = (process.env.NEXT_PUBLIC_WEB_URL ?? "").replace(/\/$/, "");
