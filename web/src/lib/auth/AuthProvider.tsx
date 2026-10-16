"use client";

import { getUserData, login as loginRequest, register as registerRequest, type RegisterInput } from "@/lib/api/auth";
import { UNAUTHORIZED_EVENT } from "@/lib/api/client";
import { clearSession, getAuthToken, getStoredUser, setSession } from "@/lib/api/token";
import type { User } from "@/lib/api/types";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type AuthStatus = "loading" | "authenticated" | "anonymous";

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  login: (phonenumber: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<User | null>(null);

  // Validate the stored token once; a rejected one is cleared by apiFetch.
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
        (u) => (u ? finish("authenticated", u) : (clearSession(), finish("anonymous", null))),
        // Offline / server down: trust the stored session until a request is rejected.
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

  const login = useCallback(async (phonenumber: string, password: string) => {
    const { token, loggedUser } = await loginRequest(phonenumber, password);
    setSession(token, loggedUser);
    setUser(loggedUser);
    setStatus("authenticated");
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const { token, loggedUser } = await registerRequest(input);
    setSession(token, loggedUser);
    setUser(loggedUser);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    setStatus("anonymous");
  }, []);

  const value = useMemo(() => ({ status, user, login, register, logout }), [status, user, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
