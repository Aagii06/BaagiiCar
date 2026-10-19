export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5011").replace(/\/$/, "");

/** Car photos live under `<backend>/uploads/cars`, in four widths. */
export type ImageSize = "icon" | "thumb" | "grid" | "full";

export function uploadUrl(fileName: string | null | undefined, size: ImageSize = "full", folder = "cars") {
  if (!fileName) return null;
  if (/^https?:\/\//.test(fileName)) return fileName;
  const prefix = size === "full" ? "" : `${size}_`;
  return `${API_BASE_URL}/uploads/${folder}/${prefix}${fileName}`;
}

/** Brand logos / body-type icons: absolute URLs, or paths served from the backend's public folder (e.g. "logos/lexus.jpg"). */
export function remoteImage(url: string | null | undefined) {
  if (!url) return null;
  if (/^https?:\/\//.test(url)) return url;
  return `${API_BASE_URL}/${url.replace(/^\//, "")}`;
}

export const CONTACT = {
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE || "",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "",
  address: process.env.NEXT_PUBLIC_CONTACT_ADDRESS || "",
};
