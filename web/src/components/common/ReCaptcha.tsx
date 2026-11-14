"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

/** Google reCAPTCHA v2 ("I'm not a robot") site key; the backend checks tokens with the matching RECAPTCHA_SECRET_KEY. */
export const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? "";

interface GreCaptcha {
  ready: (cb: () => void) => void;
  render: (el: HTMLElement, opts: Record<string, unknown>) => number;
  reset: (id?: number) => void;
}
declare global {
  interface Window {
    grecaptcha?: GreCaptcha;
  }
}

/** The api.js script, loaded once per language (a widget's language is fixed when the script loads). */
let loading: Promise<GreCaptcha> | null = null;
function loadScript(hl: string) {
  if (window.grecaptcha?.render) return Promise.resolve(window.grecaptcha);
  loading ??= new Promise<GreCaptcha>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = `https://www.google.com/recaptcha/api.js?render=explicit&hl=${hl}`;
    s.async = true;
    s.onload = () => window.grecaptcha!.ready(() => resolve(window.grecaptcha!));
    s.onerror = () => {
      loading = null;
      reject(new Error("reCAPTCHA failed to load"));
    };
    document.head.appendChild(s);
  });
  return loading;
}

export interface ReCaptchaHandle {
  /** Clears the tick; tokens are single-use, so call it after every submit. */
  reset: () => void;
}

/** "I'm not a robot" checkbox; reports the token on success and `null` when it expires or is reset. */
const ReCaptcha = forwardRef<ReCaptchaHandle, { onChange: (token: string | null) => void; className?: string }>(function ReCaptcha(
  { onChange, className },
  ref
) {
  const { locale } = useI18n();
  const box = useRef<HTMLDivElement>(null);
  const widget = useRef<number | null>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useImperativeHandle(ref, () => ({
    reset: () => {
      if (widget.current !== null) window.grecaptcha?.reset(widget.current);
      onChangeRef.current(null);
    },
  }));

  useEffect(() => {
    if (!RECAPTCHA_SITE_KEY) return;
    let cancelled = false;
    loadScript(locale).then(
      (g) => {
        if (cancelled || !box.current || widget.current !== null) return;
        widget.current = g.render(box.current, {
          sitekey: RECAPTCHA_SITE_KEY,
          callback: (token: string) => onChangeRef.current(token),
          "expired-callback": () => onChangeRef.current(null),
          "error-callback": () => onChangeRef.current(null),
        });
      },
      (err) => console.error(err)
    );
    return () => {
      cancelled = true;
    };
  }, [locale]);

  if (!RECAPTCHA_SITE_KEY) return null;
  // The widget is a fixed 304px wide; min-h keeps the form from jumping while it loads.
  return <div ref={box} className={className ?? "min-h-[78px]"} />;
});

export default ReCaptcha;
