"use client";

import { getPushKey, subscribeEmail, subscribePush, unsubscribePush, verifyEmail } from "@/lib/api/subscriptions";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { Bell, BellOff, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";

const fieldClass =
  "h-11 min-w-0 flex-1 rounded-xl border border-white/15 bg-dark-2 px-4 text-sm text-white outline-none placeholder:text-white/40 focus:border-primary";
const buttonClass = "h-11 shrink-0 rounded-xl bg-primary px-4 text-sm font-bold text-white hover:bg-primary-hover disabled:opacity-60";

/** Email → 6-digit code → confirmed. Listings then arrive as a periodic digest. Styled for a dark background. */
export function EmailSignup() {
  const { t } = useI18n();
  const [step, setStep] = useState<"email" | "code" | "done">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Seconds until the backend accepts another code request.
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Алдаа гарлаа"));
    } finally {
      setBusy(false);
    }
  };

  const requestCode = () =>
    run(async () => {
      const res = await subscribeEmail(email.trim());
      setCode("");
      setCooldown(res.resend_in ?? 60);
      setStep(res.status === "active" ? "done" : "code");
    });

  if (step === "done")
    return (
      <p className="flex items-center gap-2 text-sm font-semibold text-white">
        <CheckCircle2 className="size-4 text-success" />
        {t("{email} хаягт шинэ зарын мэдээлэл ирнэ.", { email })}
      </p>
    );

  return (
    <div>
      {step === "email" ? (
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            requestCode();
          }}
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("И-мэйл хаяг")}
            aria-label={t("И-мэйл хаяг")}
            autoComplete="email"
            className={fieldClass}
          />
          <button disabled={busy} className={buttonClass}>
            {t("Бүртгүүлэх")}
          </button>
        </form>
      ) : (
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            run(async () => {
              await verifyEmail(email.trim(), code);
              setStep("done");
            });
          }}
        >
          <p className="text-xs text-white/70">{t("{email} хаяг руу илгээсэн 6 оронтой кодыг оруулна уу.", { email })}</p>
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="000000"
              aria-label={t("Баталгаажуулах код")}
              className={cn(fieldClass, "tracking-[0.3em]")}
            />
            <button disabled={busy || code.length !== 6} className={buttonClass}>
              {t("Баталгаажуулах")}
            </button>
          </div>
          <div className="flex gap-4 text-xs font-semibold">
            <button type="button" onClick={() => setStep("email")} className="text-white/60 hover:text-white">
              {t("← Имэйл солих")}
            </button>
            <button type="button" onClick={requestCode} disabled={busy || cooldown > 0} className="text-primary disabled:opacity-60">
              {cooldown > 0 ? t("Код дахин авах ({n})", { n: cooldown }) : t("Код дахин авах")}
            </button>
          </div>
        </form>
      )}
      {error && <p className="mt-2 text-xs font-medium text-[#ff8a80]">{error}</p>}
    </div>
  );
}

function urlBase64ToUint8Array(base64: string) {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export type PushState = "unsupported" | "loading" | "off" | "on" | "denied";

// Lets every usePush() on the page (footer toggle, visit prompt) pick up a change made by another.
const PUSH_CHANGED = "push-changed";

/** Browser-notification state and actions for new listings, through public/sw.js. */
export function usePush() {
  const { t } = useI18n();
  const [state, setState] = useState<PushState>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      Promise.resolve().then(() => setState("unsupported"));
      return;
    }
    const check = () =>
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .then((reg) => reg.pushManager.getSubscription())
        .then((sub) => setState(sub ? "on" : Notification.permission === "denied" ? "denied" : "off"))
        .catch(() => setState("unsupported"));
    check();
    window.addEventListener(PUSH_CHANGED, check);
    return () => window.removeEventListener(PUSH_CHANGED, check);
  }, []);

  const changed = () => window.dispatchEvent(new Event(PUSH_CHANGED));

  const enable = async () => {
    setError(null);
    setState("loading");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "off");
        return false;
      }
      const key = await getPushKey();
      if (!key) throw new Error(t("Мэдэгдэл одоогоор боломжгүй байна"));
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(key) });
      await subscribePush(sub.toJSON());
      setState("on");
      changed();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Алдаа гарлаа"));
      setState("off");
      return false;
    }
  };

  const disable = async () => {
    setError(null);
    setState("loading");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await unsubscribePush(sub.endpoint).catch(() => undefined);
        await sub.unsubscribe();
      }
      setState("off");
      changed();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Алдаа гарлаа"));
      setState("on");
    }
  };

  return { state, error, enable, disable };
}

/** Footer on/off button for browser notifications. */
function PushToggle() {
  const { t } = useI18n();
  const { state, error, enable, disable } = usePush();

  if (state === "unsupported") return null;

  return (
    <div>
      {state === "denied" ? (
        <p className="flex items-center gap-2 text-xs text-white/60">
          <BellOff className="size-4" />
          {t("Хөтөч дээр мэдэгдэл хаалттай байна. Хөтчийн тохиргооноос зөвшөөрнө үү.")}
        </p>
      ) : (
        <button
          onClick={state === "on" ? disable : enable}
          disabled={state === "loading"}
          className={cn(
            "flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold disabled:opacity-60",
            state === "on" ? "bg-dark-2 text-white hover:bg-white/15" : "bg-white text-dark hover:bg-white/90"
          )}
        >
          {state === "on" ? <BellOff className="size-4" /> : <Bell className="size-4" />}
          {state === "on" ? t("Мэдэгдэл унтраах") : t("Хөтчийн мэдэгдэл асаах")}
        </button>
      )}
      {error && <p className="mt-2 text-xs font-medium text-[#ff8a80]">{error}</p>}
    </div>
  );
}

/** Footer block: new-listing alerts by email and browser notification. */
export default function NotifySignup() {
  const { t } = useI18n();
  return (
    <div className="grid gap-6 rounded-2xl bg-white/5 p-5 md:grid-cols-[1fr_1.2fr_auto] md:items-center md:p-6">
      <div>
        <p className="font-display text-xl font-bold">{t("Шинэ зарын мэдээлэл")}</p>
        <p className="mt-1 text-sm text-white/70">{t("Шинээр орсон машинуудыг цаг алдалгүй мэдээрэй.")}</p>
      </div>
      <EmailSignup />
      <PushToggle />
    </div>
  );
}
