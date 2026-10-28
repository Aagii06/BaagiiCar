import { MESSAGES, type MessageKey } from "./i18n/messages";
import type { T } from "./i18n/translate";

// Values are stored as is (Mongolian) — show them through `tv()`.
// Must match backend/config/constants.js — the save endpoint validates these.
export const FUEL_TYPES = ["Бензин", "Дизель", "Хайбрид", "Газ", "Цахилгаан"];
export const TRANSMISSIONS = ["Автомат", "Механик", "CVT", "Типтроник"];
export const STEERINGS = ["Зүүн", "Баруун"];

/** Body type names are stored in Mongolian: translated when known, else shown as is. */
export function bodyTypeLabel(name: string | null | undefined, t: T) {
  if (!name) return "";
  return name in MESSAGES ? t(name as MessageKey) : name;
}

/** Brand / model names come as is, except the catch-all "Other", shown as "Бусад". */
export function catalogName(name: string | null | undefined, t: T) {
  if (!name) return "";
  return name === "Other" ? t("Бусад") : name;
}

/** Leasing estimate: illustrative terms until a partner's real rates are wired in. */
export const LEASING = {
  downPaymentRate: 0.3,
  monthlyRate: 0.018,
  terms: [12, 24, 36, 48],
};

export function monthlyPayment(price: number, months: number, downRate = LEASING.downPaymentRate, monthlyRate = LEASING.monthlyRate) {
  const principal = price * (1 - downRate);
  const r = monthlyRate;
  if (!principal || !months) return 0;
  if (!r) return principal / months;
  return (principal * r) / (1 - Math.pow(1 + r, -months));
}

export const PAGE_SIZE = 12;
