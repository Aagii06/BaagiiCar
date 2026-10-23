"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { Check, Link as LinkIcon, Share2 } from "lucide-react";
import { useState, useSyncExternalStore, type ReactNode } from "react";

const noop = () => () => {};

const BTN =
  "grid size-10 place-items-center rounded-full border border-border bg-card text-foreground/70 transition hover:-translate-y-0.5 hover:text-white";

function Facebook() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-[18px]" aria-hidden>
      <path d="M13.5 21v-7.5h2.53l.38-2.94H13.5V8.69c0-.85.24-1.43 1.46-1.43h1.55V4.63A20.6 20.6 0 0 0 14.25 4.5c-2.24 0-3.77 1.37-3.77 3.88v2.18H7.95v2.94h2.53V21h3.02Z" />
    </svg>
  );
}

function X() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden>
      <path d="M17.75 3h3.07l-6.7 7.66L22 21h-6.17l-4.83-6.32L5.47 21H2.4l7.17-8.2L2 3h6.33l4.37 5.77L17.75 3Zm-1.08 16.18h1.7L7.4 4.73H5.58l11.09 14.45Z" />
    </svg>
  );
}

function Telegram() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-[18px]" aria-hidden>
      <path d="M21.43 4.3 18.4 18.6c-.23 1-.82 1.25-1.66.78l-4.6-3.39-2.22 2.13c-.24.25-.45.46-.92.46l.33-4.69 8.54-7.71c.37-.33-.08-.51-.58-.18L6.74 12.64l-4.55-1.42c-.99-.31-1-.99.21-1.47l17.78-6.85c.82-.3 1.54.2 1.25 1.4Z" />
    </svg>
  );
}

/** Icon-only share row for a car ad: Facebook, X, Telegram, copy link (+ the OS share sheet where available). */
export default function ShareButtons({ title, className }: { title: string; className?: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  // false on the server, real value in the browser — without a setState-in-effect.
  const canNativeShare = useSyncExternalStore(noop, () => typeof navigator.share === "function", () => false);

  const links: { label: string; href: (u: string, text: string) => string; hover: string; icon: ReactNode }[] = [
    { label: "Facebook", href: (u) => `https://www.facebook.com/sharer/sharer.php?u=${u}`, hover: "hover:border-[#1877f2] hover:bg-[#1877f2]", icon: <Facebook /> },
    { label: "X", href: (u, text) => `https://twitter.com/intent/tweet?url=${u}&text=${text}`, hover: "hover:border-black hover:bg-black", icon: <X /> },
    { label: "Telegram", href: (u, text) => `https://t.me/share/url?url=${u}&text=${text}`, hover: "hover:border-[#229ed9] hover:bg-[#229ed9]", icon: <Telegram /> },
  ];

  function open(build: (u: string, text: string) => string) {
    const href = build(encodeURIComponent(window.location.href), encodeURIComponent(title));
    window.open(href, "_blank", "noopener,noreferrer,width=640,height=560");
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked (insecure origin / permissions) — nothing useful to do.
    }
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {links.map((l) => (
        <button
          key={l.label}
          type="button"
          onClick={() => open(l.href)}
          title={l.label}
          aria-label={t("{name}-д хуваалцах", { name: l.label })}
          className={cn(BTN, l.hover)}
        >
          {l.icon}
        </button>
      ))}
      <button
        type="button"
        onClick={copy}
        title={copied ? t("Холбоос хуулагдлаа") : t("Холбоос хуулах")}
        aria-label={copied ? t("Холбоос хуулагдлаа") : t("Холбоос хуулах")}
        className={cn(BTN, copied ? "border-success bg-success text-white" : "hover:border-foreground hover:bg-foreground")}
      >
        {copied ? <Check className="size-4" /> : <LinkIcon className="size-4" />}
      </button>
      {canNativeShare && (
        <button
          type="button"
          onClick={() => navigator.share({ title, url: window.location.href }).catch(() => {})}
          title={t("Хуваалцах")}
          aria-label={t("Хуваалцах")}
          className={cn(BTN, "hover:border-primary hover:bg-primary")}
        >
          <Share2 className="size-4" />
        </button>
      )}
    </div>
  );
}
