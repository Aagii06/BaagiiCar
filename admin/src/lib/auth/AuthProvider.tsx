"use client";

import { getUserData, login as loginRequest } from "@/lib/api/admin";
import { UNAUTHORIZED_EVENT } from "@/lib/api/client";
import { clearSession, getAuthToken, getStoredUser, setSession } from "@/lib/api/token";
import type { User } from "@/lib/api/types";
import { ROLES } from "@/lib/constants";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type AuthStatus = "loading" | "authenticated" | "anonymous";

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  login: (phonenumber: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const isAdmin = (u: User | null) => u?.role === ROLES.admin;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let cancelled = false;
    const finish = (next: AuthStatus, nextUser: User | null) => {
      if (cancelled) return;
      setUser(nextUser);
      setStatus(next);
    };
    if (!getAuthToken()) {
      Promise.resolve().then(() => finish("anonymous", null));
    } else {
      getUserData().then(
        (u) => {
          if (!isAdmin(u)) {
            clearSession();
            finish("anonymous", null);
          } else finish("authenticated", u);
        },
        () => finish(getAuthToken() ? "authenticated" : "anonymous", getStoredUser())
      );
    }
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onUnauthorized = () => {
      setUser(null);
      setStatus("anonymous");
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  // Only admins get a session here; the backend enforces it on every write too.
  const login = useCallback(async (phonenumber: string, password: string) => {
    const { token, loggedUser } = await loginRequest(phonenumber, password);
    if (!isAdmin(loggedUser)) throw new Error("Зөвхөн админ эрхтэй хэрэглэгч нэвтэрнэ");
    setSession(token, loggedUser);
    setUser(loggedUser);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    setStatus("anonymous");
  }, []);

  const value = useMemo(() => ({ status, user, login, logout }), [status, user, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
