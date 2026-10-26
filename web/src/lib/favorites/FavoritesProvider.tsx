"use client";

import { addFavorites, getFavoriteIds, removeFavorite } from "@/lib/api/favorites";
import { useAuth } from "@/lib/auth/AuthProvider";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "baagii_car_saved";

/** The list is dropped this long after the last ad was added; each add restarts the clock. */
const SAVED_TTL_DAYS = 30;
const TTL_MS = SAVED_TTL_DAYS * 24 * 60 * 60 * 1000;

interface Stored {
  ids: number[];
  /** When an ad was last added (ms). */
  addedAt: number;
  /** Signed-in user this copy belongs to; absent for a guest's list. */
  owner?: number;
}

interface FavoritesValue {
  ids: Set<number>;
  /** True once the saved list is loaded (from this browser, or the account when signed in). */
  ready: boolean;
  isFavorite: (id: number) => boolean;
  toggle: (id: number) => void;
}

const FavoritesContext = createContext<FavoritesValue | null>(null);

function readStored(): Stored {
  const empty = { ids: [], addedAt: Date.now() };
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as Partial<Stored> | null;
    const ids = Array.isArray(parsed?.ids) ? parsed.ids.filter((n): n is number => Number.isInteger(n)) : [];
    const addedAt = typeof parsed?.addedAt === "number" ? parsed.addedAt : 0;
    if (!ids.length || Date.now() - addedAt > TTL_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return empty;
    }
    return { ids, addedAt, owner: typeof parsed?.owner === "number" ? parsed.owner : undefined };
  } catch {
    return empty;
  }
}

function writeStored(value: Stored) {
  try {
    if (value.ids.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // storage blocked — the heart still works for this visit
  }
}

/**
 * Signed out: saved ads live in this browser and expire after SAVED_TTL_DAYS.
 * Signed in: they belong to the phone-number account (synced across devices); the guest list made
 * before signing in is moved into it. A copy left by another account (or after signing out) is wiped.
 */
export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user, token, ready: authReady } = useAuth();
  const userId = user?.id;
  const [ids, setIds] = useState<Set<number>>(new Set());
  const addedAt = useRef(0);
  const [ready, setReady] = useState(false);

  const save = useCallback(
    (next: Set<number>) => writeStored({ ids: [...next], addedAt: addedAt.current, owner: userId }),
    [userId]
  );

  // Read after mount (so the server render and first client render match), and again on sign-in / sign-out.
  useEffect(() => {
    if (!authReady) return;
    let cancelled = false;
    const stored = readStored();
    addedAt.current = stored.addedAt;
    const local = stored.owner === userId ? stored.ids : stored.owner === undefined && userId ? stored.ids : [];
    if (stored.owner !== undefined && stored.owner !== userId) writeStored({ ids: [], addedAt: 0 });

    Promise.resolve().then(() => {
      if (cancelled) return;
      setIds(new Set(local));
      setReady(!token);
    });

    if (token && userId) {
      // A guest list (no owner) is handed to the account; the account's own copy just refreshes.
      const guestIds = stored.owner === undefined ? stored.ids : [];
      (guestIds.length ? addFavorites(guestIds, token) : getFavoriteIds(token)).then(
        (serverIds) => {
          if (cancelled) return;
          const next = new Set(serverIds);
          writeStored({ ids: serverIds, addedAt: Date.now(), owner: userId });
          setIds(next);
          setReady(true);
        },
        () => !cancelled && setReady(true)
      );
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      const fresh = readStored();
      if (fresh.owner === userId) setIds(new Set(fresh.ids));
    };
    window.addEventListener("storage", onStorage);
    return () => {
      cancelled = true;
      window.removeEventListener("storage", onStorage);
    };
  }, [authReady, token, userId]);

  const toggle = useCallback(
    (id: number) => {
      const adding = !ids.has(id);
      const apply = (add: boolean) =>
        setIds((prev) => {
          const next = new Set(prev);
          if (add) {
            next.add(id);
            addedAt.current = Date.now();
          } else next.delete(id);
          save(next);
          return next;
        });
      apply(adding);
      // Signed in: keep the account in step; undo the heart if the server refused.
      if (token) (adding ? addFavorites([id], token) : removeFavorite(id, token)).catch(() => apply(!adding));
    },
    [ids, token, save]
  );

  const value = useMemo(() => ({ ids, ready, isFavorite: (id: number) => ids.has(id), toggle }), [ids, ready, toggle]);
  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used inside <FavoritesProvider>");
  return ctx;
}
