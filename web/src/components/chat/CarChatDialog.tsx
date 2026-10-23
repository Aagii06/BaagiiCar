"use client";

import { PhoneInput } from "@/components/common/Field";
import { loginWithCode, sendLoginCode } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { CONTACT } from "@/lib/api/config";
import { sendMessage } from "@/lib/api/messages";
import { useAuth } from "@/lib/auth/AuthProvider";
import { OPEN_CHAT_EVENT, type ChatTopic } from "@/lib/chat";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { MessageCircle, Phone, SendHorizontal, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const CODE_LENGTH = 4;

interface ChatLine {
  from: "me" | "team";
  text: string;
}

const fieldClass =
  "h-11 w-full rounded-lg border border-input bg-white px-3.5 text-sm outline-none transition placeholder:text-muted-foreground/80 focus:border-primary focus:ring-4 focus:ring-primary/10";

/**
 * Modal for questions about an ad (opened by `openChat`). Not signed in: phone → 4-digit code first;
 * signed in: straight to the message box. Answered by the team by phone.
 */
export default function CarChatDialog() {
  const { t } = useI18n();
  const { user, token, ready, signIn, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState<ChatTopic | null>(null);
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [lines, setLines] = useState<ChatLine[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const threadEnd = useRef<HTMLDivElement>(null);
  const topicRef = useRef<ChatTopic | null>(null);
  const started = lines.length > 0;

  useEffect(() => {
    const onOpen = (e: Event) => {
      const next = (e as CustomEvent<ChatTopic | undefined>).detail ?? null;
      // Another ad (or a general question) starts a fresh thread.
      if (topicRef.current?.carId !== next?.carId) {
        setLines([]);
        setDraft("");
      }
      topicRef.current = next;
      setTopic(next);
      setError(null);
      setOpen(true);
    };
    window.addEventListener(OPEN_CHAT_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_CHAT_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((n) => n - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  // Braces: newer browsers return a Promise from scrollIntoView, which must not become the effect's cleanup.
  useEffect(() => {
    threadEnd.current?.scrollIntoView({ block: "end" });
  }, [lines, open]);

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
      if (!/^\d{8}$/.test(phone)) throw new Error(t("8 оронтой утасны дугаар оруулна уу"));
      const res = await sendLoginCode(phone);
      setCode("");
      setCooldown(res.resend_in ?? 60);
      setStep("code");
    });

  const verify = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      signIn(await loginWithCode(phone, code));
      setStep("phone");
      setCode("");
    });
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || busy || !token || !user) return;
    const first = !started;
    setDraft("");
    setLines((l) => [...l, { from: "me", text }]);
    setBusy(true);
    setError(null);
    try {
      await sendMessage({ type: "car", message: text, car_id: topic?.carId, page_url: window.location.href }, token);
      if (first)
        setLines((l) => [
          ...l,
          { from: "team", text: t("Баярлалаа! Мессежийг хүлээн авлаа. Манай ажилтан ажлын цагаар {phone} дугаарт холбогдоно.", { phone: user.phonenumber ?? "" }) },
        ]);
    } catch (err) {
      setLines((l) => l.slice(0, -1));
      setDraft(text);
      // Expired session: sign in again with the phone code.
      if (err instanceof ApiError && err.status === 401) signOut();
      else setError(err instanceof Error ? err.message : t("Алдаа гарлаа"));
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onClick={() => setOpen(false)}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="car-chat-title"
        onClick={(e) => e.stopPropagation()}
        className="flex h-[min(560px,85dvh)] w-full flex-col overflow-hidden rounded-t-2xl bg-background shadow-xl sm:max-w-md sm:rounded-2xl"
      >
        <header className="flex shrink-0 items-center gap-3 border-b border-border bg-white px-4 py-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
            <MessageCircle className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="car-chat-title" className="truncate font-bold">
              {topic ? topic.title : t("Бидэнтэй чатлах")}
            </h2>
            <p className="text-xs text-muted-foreground">{t("Ажлын цагаар утсаар эргэн холбогдоно")}</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={t("Хаах")}
            className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </header>

        {!ready ? null : !user ? (
          step === "phone" ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                requestCode();
              }}
              className="flex-1 space-y-2.5 overflow-y-auto p-4"
            >
              <p className="text-sm text-muted-foreground">{t("Утасны дугаараа оруулна уу. Бид 4 оронтой код илгээнэ.")}</p>
              <PhoneInput
                className={fieldClass}
                maskClassName="left-[15px] text-sm text-muted-foreground/80"
                value={phone}
                onChange={setPhone}
                placeholder={t("Утасны дугаар")}
                aria-label={t("Утасны дугаар")}
                autoComplete="tel"
                autoFocus
              />
              {error && <p className="text-sm font-medium text-destructive">{error}</p>}
              <button disabled={busy || phone.length !== 8} className="h-11 w-full rounded-lg bg-primary font-bold text-white hover:bg-primary-hover disabled:opacity-60">
                {t("Код авах")}
              </button>
              {CONTACT.phone && (
                <a href={`tel:${CONTACT.phone}`} className="flex items-center justify-center gap-1.5 pt-1 text-sm font-semibold text-muted-foreground hover:text-foreground">
                  <Phone className="size-3.5" />
                  {CONTACT.phone}
                </a>
              )}
            </form>
          ) : (
            <form onSubmit={verify} className="flex-1 space-y-2.5 overflow-y-auto p-4">
              <p className="text-sm text-muted-foreground">{t("{phone} дугаар руу илгээсэн 4 оронтой кодыг оруулна уу.", { phone })}</p>
              <input
                className={cn(fieldClass, "text-center text-xl font-bold tracking-[0.5em]")}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH))}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="0000"
                aria-label={t("Баталгаажуулах код")}
                autoFocus
              />
              {error && <p className="text-sm font-medium text-destructive">{error}</p>}
              <button disabled={busy || code.length !== CODE_LENGTH} className="h-11 w-full rounded-lg bg-primary font-bold text-white hover:bg-primary-hover disabled:opacity-60">
                {t("Баталгаажуулах")}
              </button>
              <div className="flex justify-between gap-4 pt-1 text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setStep("phone");
                    setError(null);
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {t("← Дугаар солих")}
                </button>
                <button type="button" onClick={requestCode} disabled={busy || cooldown > 0} className="text-primary disabled:opacity-60">
                  {cooldown > 0 ? t("Код дахин авах ({n})", { n: cooldown }) : t("Код дахин авах")}
                </button>
              </div>
            </form>
          )
        ) : (
          <>
            <div className="flex-1 space-y-2.5 overflow-y-auto p-4" aria-live="polite">
              {!started && <p className="py-6 text-center text-sm text-muted-foreground">{t("Асуултаа бичээд илгээнэ үү.")}</p>}
              {lines.map((line, i) => (
                <div key={i} className={cn("flex", line.from === "me" ? "justify-end" : "justify-start")}>
                  <p
                    className={cn(
                      "max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2 text-sm",
                      line.from === "me" ? "rounded-br-md bg-primary text-white" : "rounded-bl-md bg-white text-foreground shadow-sm"
                    )}
                  >
                    {line.text}
                  </p>
                </div>
              ))}
              <div ref={threadEnd} />
            </div>
            {error && <p className="shrink-0 px-4 pb-1 text-xs font-medium text-destructive">{error}</p>}
            <form onSubmit={send} className="flex shrink-0 gap-2 border-t border-border bg-white p-3">
              <input
                className={cn(fieldClass, "h-10")}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={2000}
                placeholder={t("Мессеж бичих…")}
                autoFocus
                aria-label={t("Мессеж")}
              />
              <button disabled={busy || !draft.trim()} aria-label={t("Илгээх")} className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary text-white disabled:opacity-50">
                <SendHorizontal className="size-4" />
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
