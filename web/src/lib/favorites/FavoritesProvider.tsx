"use client";

import { getFavorites, toggleFavorite } from "@/lib/api/cars";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

interface FavoritesValue {
  ids: Set<number>;
  /** True once the signed-in user's list has loaded. */
  ready: boolean;
  isFavorite: (id: number) => boolean;
  toggle: (id: number) => Promise<void>;
}

const FavoritesContext = createContext<FavoritesValue | null>(null);

/** Ids of the signed-in user's saved ads, so every heart shows its state. */
export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const [ids, setIds] = useState<Set<number>>(new Set());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") {
      Promise.resolve().then(() => {
        setIds(new Set());
        setReady(false);
      });
      return;
    }
    let cancelled = false;
    getFavorites().then(
      (rows) => {
        if (cancelled) return;
        setIds(new Set(rows.map((r) => r.id)));
        setReady(true);
      },
      () => undefined
    );
    return () => {
      cancelled = true;
    };
  }, [status]);

  const toggle = useCallback(
    async (id: number) => {
      if (status !== "authenticated") {
        router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      const on = await toggleFavorite(id);
      setIds((prev) => {
        const next = new Set(prev);
        if (on) next.add(id);
        else next.delete(id);
        return next;
      });
    },
    [status, router]
  );

  const value = useMemo(() => ({ ids, ready, isFavorite: (id: number) => ids.has(id), toggle }), [ids, ready, toggle]);
  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used inside <FavoritesProvider>");
  return ctx;
}
