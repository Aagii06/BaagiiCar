"use client";

import { LogoMark } from "@/components/layout/Logo";
import { CONTACT } from "@/lib/api/config";
import { sendMessage } from "@/lib/api/messages";
import { OPEN_CHAT_EVENT, type ChatTopic } from "@/lib/chat";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { T } from "@/lib/i18n/translate";
import { cn } from "@/lib/utils";
import { Headset, Phone, SendHorizontal, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const CONTACT_KEY = "baagii_car_chat_contact";

interface Contact {
  name: string;
  phone: string;
}

interface ChatLine {
  from: "me" | "team";
  text: string;
}

function readContact(): Contact {
  try {
    const saved = JSON.parse(localStorage.getItem(CONTACT_KEY) ?? "{}");
    return { name: String(saved.name ?? ""), phone: String(saved.phone ?? "") };
  } catch {
    return { name: "", phone: "" };
  }
}

/**
 * Where a visitor's message goes and what answers it. Today it is stored for
 * the admin, who calls back; an AI assistant can later answer here instead.
 */
async function deliver(text: string, contact: Contact, topic: ChatTopic | null, firstMessage: boolean, t: T): Promise<string | null> {
  await sendMessage({
    name: contact.name || undefined,
    phonenumber: contact.phone,
    message: text,
    car_id: topic?.carId,
    page_url: window.location.href,
  });
  return firstMessage ? t("Баярлалаа! Мессежийг хүлээн авлаа. Манай ажилтан ажлын цагаар {phone} дугаарт холбогдоно.", { phone: contact.phone }) : null;
}

const fieldClass =
  "h-11 w-full rounded-lg border border-input bg-white px-3.5 text-sm outline-none transition placeholder:text-muted-foreground/80 focus:border-primary focus:ring-4 focus:ring-primary/10";

/** Floating chat box in the bottom corner on every page. */
export default function ChatWidget() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState<ChatTopic | null>(null);
  const [contact, setContact] = useState<Contact>({ name: "", phone: "" });
  const [question, setQuestion] = useState("");
  const [lines, setLines] = useState<ChatLine[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const threadEnd = useRef<HTMLDivElement>(null);
  const started = lines.length > 0;

  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent<ChatTopic | undefined>).detail;
      if (detail) setTopic(detail);
      setOpen(true);
    };
    window.addEventListener(OPEN_CHAT_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_CHAT_EVENT, onOpen);
  }, []);

  // Fill in the contact used last time.
  useEffect(() => {
    if (!open) return;
    Promise.resolve().then(() => {
      const saved = readContact();
      setContact((c) => ({ name: c.name || saved.name, phone: c.phone || saved.phone }));
    });
  }, [open]);

  useEffect(() => threadEnd.current?.scrollIntoView({ block: "end" }), [lines, open]);

  const post = async (text: string) => {
    setBusy(true);
    setError(null);
    const first = !started;
    setLines((l) => [...l, { from: "me", text }]);
    try {
      const reply = await deliver(text, contact, topic, first, t);
      if (reply) setLines((l) => [...l, { from: "team", text: reply }]);
      try {
        localStorage.setItem(CONTACT_KEY, JSON.stringify(contact));
      } catch {
        // storage blocked — nothing to remember
      }
      return true;
    } catch (err) {
      setLines((l) => l.slice(0, -1));
      setError(err instanceof Error ? err.message : t("Алдаа гарлаа"));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const start = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact.name.trim()) return setError(t("Нэрээ оруулна уу"));
    if (contact.phone.length !== 8) return setError(t("8 оронтой утасны дугаар оруулна уу"));
    if (!question.trim()) return setError(t("Асуултаа бичнэ үү"));
    if (await post(question.trim())) setQuestion("");
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || busy) return;
    if (await post(draft.trim())) setDraft("");
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
            <p className="font-bold">Baagii Car Dealer</p>
            <div className="mt-3 flex justify-center gap-3">
              <span className="grid size-12 place-items-center rounded-full bg-white ring-2 ring-white/60">
                <LogoMark className="size-9 rounded-full" />
              </span>
              <span className="grid size-12 place-items-center rounded-full bg-white text-primary ring-2 ring-white/60">
                <Headset className="size-6" />
              </span>
            </div>
            <p className="mt-3 font-bold">{t("Асуулт байна уу? Бид туслая!")}</p>
            <p className="mt-1 text-xs text-white/85">{t("Ажлын цагаар утсаар эргэн холбогдоно")}</p>
            <button onClick={() => setOpen(false)} aria-label={t("Хаах")} className="absolute right-3 top-3 grid size-7 place-items-center rounded-full hover:bg-white/15">
              <X className="size-4" />
            </button>
          </header>

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

          {!started ? (
            <form onSubmit={start} className="flex-1 space-y-2.5 overflow-y-auto p-4">
              <input
                className={fieldClass}
                value={contact.name}
                onChange={(e) => setContact({ ...contact, name: e.target.value })}
                maxLength={100}
                placeholder={`${t("Таны нэр")} *`}
                aria-label={t("Таны нэр")}
                autoComplete="name"
              />
              <input
                className={fieldClass}
                value={contact.phone}
                onChange={(e) => setContact({ ...contact, phone: e.target.value.replace(/\D/g, "") })}
                inputMode="numeric"
                maxLength={8}
                placeholder={`${t("Утасны дугаар")} *`}
                aria-label={t("Утасны дугаар")}
                autoComplete="tel"
              />
              <textarea
                className={cn(fieldClass, "h-auto min-h-24 resize-none py-2.5")}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                maxLength={2000}
                placeholder={t("Таны асуулт")}
                aria-label={t("Таны асуулт")}
              />
              {error && <p className="text-sm font-medium text-destructive">{error}</p>}
              <button disabled={busy} className="h-11 w-full rounded-lg bg-primary font-bold text-white hover:bg-primary-hover disabled:opacity-60">
                {busy ? t("Илгээж байна…") : t("Чат эхлүүлэх")}
              </button>
              {CONTACT.phone && (
                <a href={`tel:${CONTACT.phone}`} className="flex items-center justify-center gap-1.5 pt-1 text-sm font-semibold text-muted-foreground hover:text-foreground">
                  <Phone className="size-3.5" />
                  {CONTACT.phone}
                </a>
              )}
            </form>
          ) : (
            <>
              <div className="flex-1 space-y-2.5 overflow-y-auto p-4" aria-live="polite">
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
                  aria-label={t("Мессеж")}
                />
                <button disabled={busy || !draft.trim()} aria-label={t("Илгээх")} className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary text-white disabled:opacity-50">
                  <SendHorizontal className="size-4" />
                </button>
              </form>
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
