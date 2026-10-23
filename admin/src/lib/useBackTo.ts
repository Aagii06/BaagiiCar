"use client";

import { useSearchParams } from "next/navigation";

/** Pages that open an ad with `?from=<key>`, and where its back button then leads. */
const ORIGINS = { home: "/", messages: "/messages" } as const;
export type CarOrigin = keyof typeof ORIGINS;

/** `/cars/12` → `/cars/12?from=messages`, so the ad's back button returns to the page it was opened from. */
export const withFrom = (href: string, from: CarOrigin | null | undefined) => (from ? `${href}?from=${from}` : href);

/**
 * Where an ad page's back button (and save) goes: the page it was opened from, else `fallback`.
 * Only known keys are honoured, so the URL can't send the user elsewhere. Needs a <Suspense> boundary above.
 */
export function useBackTo(fallback: string) {
  const raw = useSearchParams().get("from");
  const from = raw && raw in ORIGINS ? (raw as CarOrigin) : null;
  return { from, back: from ? ORIGINS[from] : fallback };
}
