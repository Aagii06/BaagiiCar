"use client";

import { PhoneInput } from "@/components/common/Field";
import { LogoMark } from "@/components/layout/Logo";
import { loginWithCode, sendLoginCode } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { CONTACT } from "@/lib/api/config";
import { sendMessage } from "@/lib/api/messages";
import { useAuth } from "@/lib/auth/AuthProvider";
import { OPEN_CHAT_EVENT, type ChatTopic } from "@/lib/chat";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { Bot, Headset, Phone, SendHorizontal, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const CODE_LENGTH = 4;

/** "car": about ads, answered by the team / dealer. "ai": the AI assistant (not connected yet). */
type ChatMode = "car" | "ai";

interface ChatLine {
  from: "me" | "team";
  text: string;
}

const fieldClass =
  "h-11 w-full rounded-lg border border-input bg-white px-3.5 text-sm outline-none transition placeholder:text-muted-foreground/80 focus:border-primary focus:ring-4 focus:ring-primary/10";

/** Floating chat box in the bottom corner on every page. */
export default function ChatWidget() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState<ChatTopic | null>(null);
  const [mode, setMode] = useState<ChatMode>("car");
  const { user, token, ready, signIn, signOut } = useAuth();
  // Not signed in: phone → code, then the thread.
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [lines, setLines] = useState<ChatLine[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const threadEnd = useRef<HTMLDivElement>(null);
  const started = lines.length > 0;

  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent<ChatTopic | undefined>).detail;
      if (detail) {
        setTopic(detail);
        setMode("car");
      }
      setOpen(true);
    };
    window.addEventListener(OPEN_CHAT_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_CHAT_EVENT, onOpen);
  }, []);

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

  return (
    // Sits above the mobile tab bar; bottom corner from md up.
    <div className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] right-4 z-50 flex flex-col items-end gap-3 md:bottom-6 md:right-6">
      {open && (
        <section
          role="dialog"
          aria-label={t("Бидэнтэй чатлах")}
          className="flex h-[min(560px,calc(100dvh-9rem))] w-[calc(100vw-2rem)] max-w-[370px] flex-col overflow-hidden rounded-2xl bg-background shadow-2xl shadow-black/25"
        >
          <header className="relative shrink-0 bg-primary px-5 pb-5 pt-4 text-center text-white">
            <p className="font-bold">Cardealer</p>
            <div className="mt-3 flex justify-center gap-3">
              <span className="grid size-12 place-items-center rounded-full bg-white ring-2 ring-white/60">
                <LogoMark className="size-9 rounded-full" />
              </span>
              <span className="grid size-12 place-items-center rounded-full bg-white text-primary ring-2 ring-white/60">
                <Headset className="size-6" />
              </span>
            </div>
            <p className="mt-3 font-bold">{mode === "ai" ? t("AI туслах") : t("Асуулт байна уу? Бид туслая!")}</p>
            <p className="mt-1 text-xs text-white/85">{mode === "ai" ? t("Машин сонголт, ерөнхий асуултад хариулна") : t("Ажлын цагаар утсаар эргэн холбогдоно")}</p>
            <button onClick={() => setOpen(false)} aria-label={t("Хаах")} className="absolute right-3 top-3 grid size-7 place-items-center rounded-full hover:bg-white/15">
              <X className="size-4" />
            </button>
          </header>

          <div role="tablist" aria-label={t("Мессежийн төрөл")} className="grid shrink-0 grid-cols-2 border-b border-border bg-white text-sm font-semibold">
            {(
              [
                ["car", t("Зарын тухай"), Headset],
                ["ai", t("AI туслах"), Bot],
              ] as const
            ).map(([m, label, Icon]) => (
              <button
                key={m}
                role="tab"
                aria-selected={mode === m}
                onClick={() => {
                  setMode(m);
                  setError(null);
                }}
                className={cn(
                  "flex items-center justify-center gap-1.5 border-b-2 py-2.5",
                  mode === m ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="size-4" />
                {label}
              </button>
            ))}
          </div>

          {mode === "ai" ? (
            // AI is not connected yet; its thread will live here (messages.type = "ai").
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
              <span className="grid size-14 place-items-center rounded-full bg-primary/10 text-primary">
                <Bot className="size-7" />
              </span>
              <p className="font-bold">{t("AI туслах удахгүй нэмэгдэнэ")}</p>
              <p className="text-sm text-muted-foreground">{t("Одоохондоо зарын тухай асуултаа манай ажилтнаас асуугаарай.")}</p>
              <button onClick={() => setMode("car")} className="mt-1 h-10 rounded-lg bg-primary px-5 text-sm font-bold text-white hover:bg-primary-hover">
                {t("Зарын тухай асуух")}
              </button>
            </div>
          ) : (
            <>
              {topic && (
                <div className="flex shrink-0 items-center gap-2 border-b border-border bg-white px-4 py-2 text-sm">
                  <span className="min-w-0 flex-1 truncate">
                    <span className="text-muted-foreground">{t("Зар")}: </span>
                    <span className="font-semibold">{topic.title}</span>
                  </span>
                  {!started && (
                    <button onClick={() => setTopic(null)} aria-label={t("Хасах")} className="shrink-0 text-muted-foreground hover:text-foreground">
                      <X className="size-4" />
                    </button>
                  )}
                </div>
              )}

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
            </>
          )}
        </section>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? t("Хаах") : t("Бидэнтэй чатлах")}
        aria-expanded={open}
        className="grid size-14 place-items-center rounded-full bg-primary text-white shadow-lg shadow-primary/30 transition hover:scale-105 hover:bg-primary-hover"
      >
        {open ? <X className="size-6" /> : <Headset className="size-6" />}
      </button>
    </div>
  );
}
