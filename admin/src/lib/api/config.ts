export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5011").replace(/\/$/, "");

/**
 * Uploaded images (cars, brands, body types, dealers, users) are kept in four sizes, each fit into a square box:
 * icon 128 / thumb 240 / grid 480 / full 800 (the original name). Small pictures ask for a small cut:
 * icon ≤ 64px on screen, thumb ≤ 120px, grid for cards; full only for large views.
 * SVGs (and files from before resizing) have no cuts; `Img` / `CarImage` fall back to the original then.
 */
export type ImageSize = "icon" | "thumb" | "grid" | "full";

export function uploadUrl(fileName: string | null | undefined, size: ImageSize = "full", folder = "cars") {
  if (!fileName) return null;
  if (/^https?:\/\//.test(fileName)) return fileName;
  const prefix = size === "full" || /\.svg$/i.test(fileName) ? "" : `${size}_`;
  return `${API_BASE_URL}/uploads/${folder}/${prefix}${fileName}`;
}

/** The original (full) file of a resized cut, or null when the URL isn't one: ".../uploads/cars/thumb_x.jpg" → ".../uploads/cars/x.jpg". */
export function originalImage(url: string | null | undefined) {
  const m = url?.match(/^(.*\/uploads\/[^/]+\/)(?:icon|thumb|grid)_([^/]+)$/);
  return m ? m[1] + m[2] : null;
}

/** Brand logos, body-type icons, dealer logos, profile photos: the DB keeps only the file name, stored in `<backend>/uploads/<folder>`; absolute URLs pass through. */
export function catalogImage(fileName: string | null | undefined, folder: "brands" | "bodyTypes" | "users" | "dealers", size: ImageSize = "full") {
  return uploadUrl(fileName?.trim(), size, folder);
}

/** Public site, for "open on site" links. */
export const WEB_URL = (process.env.NEXT_PUBLIC_WEB_URL ?? "").replace(/\/$/, "");
