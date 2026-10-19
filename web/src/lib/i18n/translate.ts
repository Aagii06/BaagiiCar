import { DEFAULT_LOCALE, isLocale, type Locale } from "./config";
import { MESSAGES, type MessageKey } from "./messages";

export type Vars = Record<string, string | number>;

/** `t("{n} зар олдлоо", { n: 5 })` — the Mongolian source text is the key. */
export type T = (key: MessageKey, vars?: Vars) => string;

function fill(text: string, vars?: Vars) {
  return vars ? text.replace(/\{(\w+)\}/g, (m, name: string) => (name in vars ? String(vars[name]) : m)) : text;
}

export function translate(locale: Locale, key: MessageKey, vars?: Vars) {
  return fill(locale === "mn" ? key : MESSAGES[key][locale], vars);
}

/** For values stored in Mongolian (fuel type, steering…): translated when known, else shown as is. */
export function translateValue(locale: Locale, value: string | null | undefined) {
  if (!value) return "";
  return value in MESSAGES ? translate(locale, value as MessageKey) : value;
}

/** The page's current locale outside React (e.g. API error messages). */
export function documentLocale(): Locale {
  const lang = typeof document !== "undefined" ? document.documentElement.lang : "";
  return isLocale(lang) ? lang : DEFAULT_LOCALE;
}
