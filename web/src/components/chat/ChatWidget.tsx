"use client";

import { inputClass } from "@/components/common/Field";
import { CONTACT } from "@/lib/api/config";
import { sendMessage } from "@/lib/api/messages";
import { OPEN_CHAT_EVENT, type ChatTopic } from "@/lib/chat";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { CheckCircle2, MessageCircle, Phone, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const CONTACT_KEY = "baagii_car_chat_contact";

function readContact(): { name: string; phone: string } {
  try {
    const saved = JSON.parse(localStorage.getItem(CONTACT_KEY) ?? "{}");
    return { name: String(saved.name ?? ""), phone: String(saved.phone ?? "") };
  } catch {
    return { name: "", phone: "" };
  }
}

/**
 * Floating chat box in the bottom corner on every page. Messages go to the
 * admin panel; the admin calls back on the phone number left here.
 */
export default function ChatWidget() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState<ChatTopic | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent<ChatTopic | undefined>).detail;
      if (detail) {
        setTopic(detail);
        setSent(false);
      }
      setOpen(true);
    };
    window.addEventListener(OPEN_CHAT_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_CHAT_EVENT, onOpen);
  }, []);

  // Fill in the contact used last time; focus the message when the box opens.
  useEffect(() => {
    if (!open) return;
    Promise.resolve().then(() => {
      const saved = readContact();
      setName((v) => v || saved.name);
      setPhone((v) => v || saved.phone);
      messageRef.current?.focus();
    });
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length !== 8) return setError(t("8 оронтой утасны дугаар оруулна уу"));
    if (!message.trim()) return setError(t("Мессеж бичнэ үү"));
    setBusy(true);
    setError(null);
    try {
      await sendMessage({
        name: name.trim() || undefined,
        phonenumber: phone,
        message: message.trim(),
        car_id: topic?.carId,
        page_url: window.location.href,
      });
      try {
        localStorage.setItem(CONTACT_KEY, JSON.stringify({ name: name.trim(), phone }));
      } catch {
        // storage blocked — nothing to remember
      }
      setMessage("");
      setTopic(null);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Алдаа гарлаа"));
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
          className="flex max-h-[calc(100dvh-9rem)] w-[calc(100vw-2rem)] max-w-[360px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl shadow-black/20"
        >
          <header className="flex items-start gap-3 bg-dark px-4 py-3.5 text-white">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary">
              <MessageCircle className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-bold">{t("Бидэнтэй чатлах")}</p>
              <p className="text-xs text-white/70">{t("Мессеж үлдээвэл бид утсаар эргэн холбогдоно.")}</p>
            </div>
            <button onClick={() => setOpen(false)} aria-label={t("Хаах")} className="grid size-7 place-items-center rounded-full hover:bg-white/10">
              <X className="size-4" />
            </button>
          </header>

          {sent ? (
            <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
              <CheckCircle2 className="size-10 text-success" />
              <p className="font-bold">{t("Мессеж илгээгдлээ")}</p>
              <p className="text-sm text-muted-foreground">{t("Бид ажлын цагаар {phone} дугаарт холбогдоно.", { phone })}</p>
              <button onClick={() => setSent(false)} className="mt-2 rounded-xl bg-muted px-4 py-2.5 text-sm font-bold hover:bg-border">
                {t("Шинэ мессеж")}
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-3 overflow-y-auto p-4">
              {topic && (
                <div className="flex items-center gap-2 rounded-xl bg-primary-soft px-3 py-2 text-sm">
                  <span className="min-w-0 flex-1 truncate">
                    <span className="text-muted-foreground">{t("Зар")}: </span>
                    <span className="font-semibold">{topic.title}</span>
                  </span>
                  <button type="button" onClick={() => setTopic(null)} aria-label={t("Хасах")} className="shrink-0 text-muted-foreground hover:text-foreground">
                    <X className="size-4" />
                  </button>
                </div>
              )}
              <textarea
                ref={messageRef}
                className={cn(inputClass, "h-auto min-h-24 py-3")}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={2000}
                placeholder={t("Асуултаа бичнэ үү")}
                aria-label={t("Мессеж")}
              />
              <div className="grid grid-cols-2 gap-2">
                <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={100} placeholder={t("Нэр")} aria-label={t("Нэр")} autoComplete="name" />
                <input
                  className={inputClass}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  inputMode="numeric"
                  maxLength={8}
                  placeholder={t("Утасны дугаар")}
                  aria-label={t("Утасны дугаар")}
                  autoComplete="tel"
                />
              </div>
              {error && <p className="text-sm font-medium text-destructive">{error}</p>}
              <button disabled={busy} className="h-11 w-full rounded-xl bg-primary font-bold text-white hover:bg-primary-hover disabled:opacity-60">
                {busy ? t("Илгээж байна…") : t("Илгээх")}
              </button>
              {CONTACT.phone && (
                <a href={`tel:${CONTACT.phone}`} className="flex items-center justify-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
                  <Phone className="size-3.5" />
                  {CONTACT.phone}
                </a>
              )}
            </form>
          )}
        </section>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? t("Хаах") : t("Бидэнтэй чатлах")}
        aria-expanded={open}
        className="grid size-14 place-items-center rounded-full bg-primary text-white shadow-lg shadow-primary/30 transition hover:scale-105 hover:bg-primary-hover"
      >
        {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
      </button>
    </div>
  );
}
