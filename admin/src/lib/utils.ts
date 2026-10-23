import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toNumber(value: string | number | null | undefined) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** "45,000,000₮" */
export function formatPrice(value: string | number | null | undefined) {
  const n = toNumber(value);
  return n ? `${Math.round(n).toLocaleString("en-US")}₮` : "Үнэ тохирно";
}

/** "45.5 сая₮" — compact price for cards. */
export function formatPriceShort(value: string | number | null | undefined) {
  const n = toNumber(value);
  if (!n) return "Үнэ тохирно";
  if (n >= 1_000_000) return `${Number((n / 1_000_000).toFixed(1)).toLocaleString("en-US")} сая₮`;
  return formatPrice(n);
}

export function formatNumber(value: string | number | null | undefined) {
  return toNumber(value).toLocaleString("en-US");
}

export function formatEngine(value: string | number | null | undefined) {
  const n = toNumber(value);
  return n ? `${n} л` : "—";
}

/** "2 цагийн өмнө" from the backend's "YYYY-MM-DD HH:mm:ss" (+08:00). */
export function timeAgo(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value.replace(" ", "T") + "+08:00");
  if (Number.isNaN(date.getTime())) return "";
  const minutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) return "саяхан";
  if (minutes < 60) return `${minutes} минутын өмнө`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} цагийн өмнө`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} өдрийн өмнө`;
  return value.slice(0, 10);
}

export function initials(name: string | null | undefined) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return parts
    .slice(-2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export function userName(u: { firstname?: string | null; lastname?: string | null; phonenumber?: string | null } | null) {
  if (!u) return "";
  return [u.lastname, u.firstname].filter(Boolean).join(" ") || u.phonenumber || "";
}

const TINTS = ["bg-tint-blue", "bg-tint-peach", "bg-tint-mint", "bg-tint-lavender", "bg-tint-rose"];

/** Stable card tint per car, like the design's pastel image wells. */
export function tintFor(id: number) {
  return TINTS[Math.abs(id) % TINTS.length];
}

/** "Toyota Aqua 2016/2018": brand, model, then manufactured / imported year (either year alone when the other is missing). */
export function carTitle(car: { name?: string | null; brand_name?: string | null; model_name?: string | null; manufactured_year?: number | null; imported_year?: number | null }) {
  const years = [car.manufactured_year, car.imported_year].filter(Boolean).join("/");
  const title = [car.brand_name, car.model_name, years].filter(Boolean).join(" ");
  return title || car.name || "";
}
