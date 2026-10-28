"use client";

import { useSyncExternalStore } from "react";

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

// Chrome/Android fire `beforeinstallprompt` once, right after load — kept here so a later
// "Апп суулгах" tap can still show the browser's own install dialog.
let deferred: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as InstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    notify();
  });
}

const isStandalone = () =>
  typeof window !== "undefined" && (window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true);

export const isIos = () => typeof navigator !== "undefined" && (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => void listeners.delete(l);
};

/** `installed`: already opened from the home screen. `prompt()`: the browser dialog (false when none is available). */
export function useInstallPrompt() {
  const installed = useSyncExternalStore(subscribe, isStandalone, () => false);
  const canPrompt = useSyncExternalStore(subscribe, () => deferred !== null, () => false);
  return {
    installed,
    canPrompt,
    prompt: async () => {
      if (!deferred) return false;
      const e = deferred;
      deferred = null;
      notify();
      await e.prompt();
      return (await e.userChoice).outcome === "accepted";
    },
  };
}
