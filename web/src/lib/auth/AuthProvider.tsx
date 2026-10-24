"use client";

import { ApiError } from "@/lib/api/client";
import { getMe, type Session, type WebUser } from "@/lib/api/auth";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "baagii_car_auth";

interface AuthValue {
  user: WebUser | null;
  token: string | null;
  /** True once the stored session has been read from this browser. */
  ready: boolean;
  signIn: (session: Session) => void;
  signOut: () => void;
  /** Replaces the cached profile after it was edited. */
  setUser: (user: WebUser) => void;
}

const AuthContext = createContext<AuthValue | null>(null);

function readStored(): Session | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as Partial<Session> | null;
    return typeof parsed?.token === "string" && parsed.user ? (parsed as Session) : null;
  } catch {
    return null;
  }
}

function writeStored(session: Session | null) {
  try {
    if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // storage blocked — signed in for this visit only
  }
}

/** Phone + code sign-in. The JWT (7 days) is kept in this browser and re-checked against the backend on load. */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  // Read after mount so the server render and first client render match.
  useEffect(() => {
    const stored = readStored();
    Promise.resolve().then(() => {
      setSession(stored);
      setReady(true);
    });
    if (stored)
      getMe(stored.token).then(
        (user) => {
          const next = { token: stored.token, user };
          writeStored(next);
          setSession((cur) => (cur?.token === stored.token ? next : cur));
        },
        (err: unknown) => {
          // Expired token or removed account; other failures (offline) keep the cached session.
          if (err instanceof ApiError && err.status === 401) {
            writeStored(null);
            setSession((cur) => (cur?.token === stored.token ? null : cur));
          }
        }
      );

    const onStorage = (e: StorageEvent) => e.key === STORAGE_KEY && setSession(readStored());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const signIn = useCallback((next: Session) => {
    writeStored(next);
    setSession(next);
  }, []);

  const signOut = useCallback(() => {
    writeStored(null);
    setSession(null);
  }, []);

  const setUser = useCallback((user: WebUser) => {
    setSession((cur) => {
      if (!cur) return cur;
      const next = { ...cur, user };
      writeStored(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ user: session?.user ?? null, token: session?.token ?? null, ready, signIn, signOut, setUser }),
    [session, ready, signIn, signOut, setUser]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

/** Name if the user filled one in, else the phone number. */
export function displayName(user: WebUser) {
  // Овог түр ашиглахгүй: [user.firstname, user.lastname].filter(Boolean).join(" ")
  return user.firstname || user.phonenumber || "";
}
