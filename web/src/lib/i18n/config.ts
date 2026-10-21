export const LOCALES = ["mn", "ru", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "mn";

/** Off: everyone gets Mongolian and the header hides the language picker. */
export const LANGUAGE_SWITCHING = false;

/** Cookie holding the visitor's chosen language; read by I18nProvider. */
export const LOCALE_COOKIE = "lang";

export const LOCALE_NAMES: Record<Locale, string> = {
  mn: "Монгол",
  ru: "Русский",
  en: "English",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** Chosen cookie first, then the browser's Accept-Language, then Mongolian. */
export function pickLocale(cookie: string | undefined, acceptLanguage: string | null): Locale {
  if (!LANGUAGE_SWITCHING) return DEFAULT_LOCALE;
  if (isLocale(cookie)) return cookie;
  for (const part of (acceptLanguage ?? "").split(",")) {
    const lang = part.split(";")[0].trim().slice(0, 2).toLowerCase();
    if (isLocale(lang)) return lang;
  }
  return DEFAULT_LOCALE;
}
