"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { LOCALE_COOKIE, pickLocale, type Locale } from "./config";
import { translate, translateValue, type T } from "./translate";

interface I18nValue {
  locale: Locale;
  t: T;
  /** Lenient `t` for Mongolian values that come from the backend. */
  tv: (value: string | null | undefined) => string;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nValue | null>(null);

/** The visitor's saved choice, else their browser language (see pickLocale). */
function browserLocale() {
  const cookie = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`))?.[1];
  return pickLocale(cookie, navigator.languages.join(","));
}

const subscribeNever = () => () => {};

export function I18nProvider({ locale: initial, children }: { locale: Locale; children: React.ReactNode }) {
  // The static export is built in the default language (`initial`); switch to
  // the browser's pick after hydration, until the visitor chooses one.
  const detected = useSyncExternalStore(subscribeNever, browserLocale, () => initial);
  const [chosen, setChosen] = useState<Locale | null>(null);
  const locale = chosen ?? detected;

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    setChosen(next);
  }, []);

  const value = useMemo<I18nValue>(
    () => ({
      locale,
      t: (key, vars) => translate(locale, key, vars),
      tv: (v) => translateValue(locale, v),
      setLocale,
    }),
    [locale, setLocale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}
