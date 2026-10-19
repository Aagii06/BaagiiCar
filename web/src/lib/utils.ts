import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { T } from "./i18n/translate";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toNumber(value: string | number | null | undefined) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** "45,000,000₮" */
export function formatPrice(value: string | number | null | undefined, t: T) {
  const n = toNumber(value);
  return n ? `${Math.round(n).toLocaleString("en-US")}₮` : t("Үнэ тохирно");
}

/** "45.5 сая₮" — compact price for cards. */
export function formatPriceShort(value: string | number | null | undefined, t: T) {
  const n = toNumber(value);
  if (!n) return t("Үнэ тохирно");
  if (n >= 1_000_000) return t("{n} сая₮", { n: Number((n / 1_000_000).toFixed(1)).toLocaleString("en-US") });
  return formatPrice(n, t);
}

export function formatNumber(value: string | number | null | undefined) {
  return toNumber(value).toLocaleString("en-US");
}

export function formatEngine(value: string | number | null | undefined, t: T) {
  const n = toNumber(value);
  return n ? t("{n} л", { n }) : "—";
}

/** "2 цагийн өмнө" from the backend's "YYYY-MM-DD HH:mm:ss" (+08:00). */
export function timeAgo(value: string | null | undefined, t: T) {
  if (!value) return "";
  const date = new Date(value.replace(" ", "T") + "+08:00");
  if (Number.isNaN(date.getTime())) return "";
  const minutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) return t("саяхан");
  if (minutes < 60) return t("{n} минутын өмнө", { n: minutes });
  const hours = Math.round(minutes / 60);
  if (hours < 24) return t("{n} цагийн өмнө", { n: hours });
  const days = Math.round(hours / 24);
  if (days < 30) return t("{n} өдрийн өмнө", { n: days });
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
