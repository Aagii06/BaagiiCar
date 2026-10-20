"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";
import { Bell, X } from "lucide-react";
import { useEffect, useState } from "react";
import { usePush } from "./NotifySignup";

const DISMISSED_KEY = "push-prompt-dismissed-at";
const ASK_AGAIN_AFTER = 7 * 24 * 60 * 60 * 1000;
const SHOW_DELAY = 5000;

function recentlyDismissed() {
  try {
    const at = Number(localStorage.getItem(DISMISSED_KEY));
    return at > 0 && Date.now() - at < ASK_AGAIN_AFTER;
  } catch {
    return false;
  }
}

/**
 * Asks once per visit (at most weekly) whether to turn on new-listing notifications.
 * The browser's own permission dialog opens only from the "Allow" click: browsers
 * mute or block permission requests made without a user gesture.
 */
export default function PushPrompt() {
  const { t } = useI18n();
  const { state, error, enable } = usePush();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (state !== "off" || recentlyDismissed()) return;
    const timer = window.setTimeout(() => setOpen(true), SHOW_DELAY);
    return () => window.clearTimeout(timer);
  }, [state]);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    } catch {}
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && dismiss();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Granted or blocked in the browser dialog: nothing left to ask.
  if (!open || state === "on" || state === "denied" || state === "unsupported") return null;

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/40 p-4" onClick={dismiss}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="push-prompt-title"
        className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label={t("Хаах")}
          className="absolute right-3 top-3 grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>
        <span className="grid size-12 place-items-center rounded-full bg-primary-soft text-primary">
          <Bell className="size-6" />
        </span>
        <h2 id="push-prompt-title" className="mt-4 text-lg font-bold">
          {t("Шинэ зар орохоор мэдэгдэл авах уу?")}
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {t("Шинэ машин зарагдахаар таны хөтөч рүү шууд мэдэгдэл илгээнэ. Хүссэн үедээ унтрааж болно.")}
        </p>
        {error && <p className="mt-3 text-xs font-medium text-destructive">{error}</p>}
        <div className="mt-5 flex gap-2">
          <button type="button" onClick={dismiss} className="h-11 flex-1 rounded-xl bg-muted text-sm font-bold hover:bg-border">
            {t("Дараа")}
          </button>
          <button
            type="button"
            disabled={state === "loading"}
            onClick={async () => {
              if (await enable()) setOpen(false);
            }}
            className="h-11 flex-1 rounded-xl bg-primary text-sm font-bold text-white hover:bg-primary-hover disabled:opacity-60"
          >
            {t("Зөвшөөрөх")}
          </button>
        </div>
      </div>
    </div>
  );
}
