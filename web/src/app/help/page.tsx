"use client";

import Container from "@/components/common/Container";
import EmailCodeDialog from "@/components/common/EmailCodeDialog";
import { Field, inputClass, PhoneInput } from "@/components/common/Field";
import { PageSkeleton } from "@/components/common/States";
import { EmailSignup } from "@/components/layout/NotifySignup";
import { sendEmailCode } from "@/lib/api/auth";
import { CONTACT } from "@/lib/api/config";
import { displayName, useAuth } from "@/lib/auth/AuthProvider";
import { openChat } from "@/lib/chat";
import type { MessageKey } from "@/lib/i18n/messages";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { BadgeCheck, CreditCard, Mail, MessageCircle, Minus, Phone, Plus, Search, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

const TOPICS: { icon: typeof Plus; tint: string; title: MessageKey; text: MessageKey; href: string }[] = [
  { icon: Search, tint: "bg-tint-blue text-primary", title: "Машин хайх", text: "Шүүлтүүр ашиглан тохирох машинаа олох.", href: "/cars" },
  { icon: ShieldCheck, tint: "bg-tint-mint text-success", title: "Аюулгүй худалдаа", text: "Залилангаас сэргийлэх зөвлөмж.", href: "#safety" },
  { icon: CreditCard, tint: "bg-tint-peach text-amber-ink", title: "Төлбөр, лизинг", text: "Зээл, лизингийн нөхцөл, тооцоолуур.", href: "/leasing" },
  { icon: Phone, tint: "bg-tint-lavender text-[#5b3fae]", title: "Холбоо барих", text: "Утас, и-мэйлээр бидэнтэй холбогдох.", href: "#contact" },
];

const FAQ: { id: string; q: MessageKey; a: MessageKey }[] = [
  { id: "sell", q: "Машинаа зарах боломжтой юу?", a: "Зарыг манай админ оруулдаг. Машинаа зарах бол доорх маягтаар эсвэл утсаар бидэнтэй холбогдоно уу." },
  {
    id: "safety",
    q: "Залилангаас яаж сэргийлэх вэ?",
    a: "Машиныг биечлэн үзэж, бичиг баримтыг (гэрчилгээ, арлын дугаар) шалгасны дараа төлбөрөө шилжүүлээрэй. Урьдчилгаа нэхсэн, үзүүлэхээс татгалзсан зарлагчаас болгоомжилно уу.",
  },
  { id: "featured", q: "“Онцлох” тэмдэг гэж юу вэ?", a: "Админ шалгаж онцолсон зарууд нүүр хуудсанд болон хайлтын дээд хэсэгт гарна." },
  { id: "leasing", q: "Лизингээр авах боломжтой юу?", a: "Тийм. Зар бүрийн хажууд байгаа тооцоолуураар сарын төлбөрөө урьдчилан тооцоолж, хүсэлтээ бидэнд илгээгээрэй." },
];

function HelpInner() {
  const { t } = useI18n();
  const sp = useSearchParams();
  const topic = sp.get("topic");
  const car = sp.get("car");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(topic === "leasing" ? "leasing" : "sell");
  const { user, token, setUser } = useAuth();
  const [form, setForm] = useState({
    name: user ? displayName(user) : "",
    phone: user?.phonenumber ?? "",
    email: user?.email ?? "",
    message: topic === "leasing" ? `${t("Лизингийн хүсэлт")}${car ? ` — ${t("зар #{id}", { id: car })}` : ""}\n` : "",
  });

  const faq = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? FAQ.filter((f) => (t(f.q) + t(f.a)).toLowerCase().includes(q)) : FAQ;
  }, [query, t]);

  // The e-mail typed here becomes the customer's own (profile) address once its code checks out.
  const trimmedEmail = form.email.trim().toLowerCase();
  const emailVerified = !!trimmedEmail && trimmedEmail === (user?.email ?? "").toLowerCase();
  const [verifying, setVerifying] = useState<string | null>(null);
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const canRequestCode = !emailBusy && !emailVerified && /^\S+@\S+\.\S+$/.test(trimmedEmail);
  const requestCode = async () => {
    if (!canRequestCode || !token) return;
    setEmailBusy(true);
    setEmailError(null);
    try {
      await sendEmailCode(token, trimmedEmail);
      setVerifying(trimmedEmail);
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : String(err));
    } finally {
      setEmailBusy(false);
    }
  };

  // No contact endpoint on the backend yet, so the form opens the user's mail app.
  const mailto = CONTACT.email
    ? `mailto:${CONTACT.email}?subject=${encodeURIComponent(`Cardealer — ${t("асуулт")}`)}&body=${encodeURIComponent(`${form.message}\n\n${[form.name, form.phone, form.email].filter(Boolean).join(" · ")}`)}`
    : null;

  return (
    <>
      <Container className="pt-4 md:pt-8">
        <section className="rounded-[28px] bg-dark px-6 py-12 text-center text-white md:py-16">
          <span className="eyebrow inline-block rounded-full bg-dark-2 px-3 py-1.5 text-primary">{t("Тусламжийн төв")}</span>
          <h1 className="mt-5 font-display text-[28px] font-bold leading-tight tracking-tight md:text-5xl">{t("Бид танд юугаар туслах вэ?")}</h1>
          <form
            className="mx-auto mt-7 flex max-w-xl items-center gap-2 rounded-2xl bg-white p-1.5 pl-4"
            onSubmit={(e) => {
              e.preventDefault();
              document.getElementById("faq")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("Асуултаа бичнэ үү")} className="min-w-0 flex-1 bg-transparent py-2 text-foreground outline-none placeholder:text-muted-foreground" />
            <button className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold">{t("Хайх")}</button>
          </form>
        </section>
      </Container>

      <Container className="mt-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TOPICS.map(({ icon: Icon, tint, title, text, href }) => (
            <Link key={title} href={href} className="rounded-2xl bg-card p-5 transition-shadow hover:shadow-lg hover:shadow-black/5">
              <span className={cn("grid size-11 place-items-center rounded-xl", tint)}>
                <Icon className="size-5" />
              </span>
              <h2 className="mt-4 font-bold">{t(title)}</h2>
              <p className="mt-1.5 text-[13px] text-muted-foreground">{t(text)}</p>
            </Link>
          ))}
        </div>
      </Container>

      <Container className="mt-10 grid gap-8 lg:grid-cols-[1fr_380px]">
        <section id="faq" className="scroll-mt-24">
          <h2 className="font-display text-2xl font-bold tracking-tight md:text-[30px]">{t("Түгээмэл асуултууд")}</h2>
          <div className="mt-5 space-y-3">
            {faq.map((f) => {
              const isOpen = open === f.id;
              return (
                <div key={f.id} id={f.id} className="scroll-mt-24 rounded-2xl bg-card">
                  <button onClick={() => setOpen(isOpen ? null : f.id)} aria-expanded={isOpen} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-bold">
                    {t(f.q)}
                    <span className={cn("grid size-7 shrink-0 place-items-center rounded-full", isOpen ? "bg-primary text-white" : "bg-muted")}>
                      {isOpen ? <Minus className="size-4" /> : <Plus className="size-4" />}
                    </span>
                  </button>
                  {isOpen && <p className="px-5 pb-5 text-sm leading-6 text-foreground/80">{t(f.a)}</p>}
                </div>
              );
            })}
            {!faq.length && <p className="rounded-2xl bg-card px-5 py-6 text-sm text-muted-foreground">{t("Тохирох асуулт олдсонгүй. Доорх маягтаар бидэнд бичээрэй.")}</p>}
          </div>
        </section>

        <aside id="contact" className="scroll-mt-24 self-start rounded-2xl bg-card p-5 md:p-6">
          <h2 className="text-lg font-bold">{t("Бидэнд бичих")}</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">{t("Тусламж хэрэгтэй бол бидэнд хандана уу.")}</p>
          <div className="mt-5 space-y-4">
            <Field label={t("Нэр")}>
              <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label={t("Утас")}>
              <PhoneInput autoComplete="tel" placeholder={t("Утасны дугаар")} value={form.phone} onChange={(phone) => setForm({ ...form, phone })} />
            </Field>
            <Field
              label={t("И-мэйл")}
              hint={trimmedEmail && !emailVerified ? t("Шинэ хаяг руу баталгаажуулах код илгээнэ.") : undefined}
              error={emailError ?? undefined}
            >
              <span className="relative block">
                <input
                  className={cn(inputClass, trimmedEmail && "pr-28")}
                  type="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    e.preventDefault();
                    requestCode();
                  }}
                />
                {emailVerified ? (
                  <span className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1 text-sm font-semibold text-success">
                    <BadgeCheck className="size-4" />
                    {t("Баталгаажсан")}
                  </span>
                ) : (
                  trimmedEmail && (
                    <button
                      type="button"
                      onClick={requestCode}
                      disabled={!canRequestCode}
                      className="absolute right-1.5 top-1/2 h-9 -translate-y-1/2 rounded-lg bg-primary px-3 text-sm font-bold text-white transition hover:bg-primary-hover disabled:opacity-60"
                    >
                      {t("Код авах")}
                    </button>
                  )
                )}
              </span>
            </Field>
            <Field label={t("Асуулт")}>
              <textarea className={cn(inputClass, "h-auto min-h-28 py-3")} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            </Field>
            {mailto ? (
              <a href={mailto} className="block rounded-xl bg-primary py-3.5 text-center font-bold text-white hover:bg-primary-hover">
                {t("Илгээх")}
              </a>
            ) : (
              <button type="button" disabled className="block w-full rounded-xl bg-primary py-3.5 text-center font-bold text-white opacity-60">
                {t("Илгээх")}
              </button>
            )}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2 border-t border-border pt-5">
            <button onClick={() => openChat()} className="flex items-center justify-center gap-2 rounded-xl bg-muted py-3 text-sm font-bold hover:bg-border">
              <MessageCircle className="size-4" />
              {t("Чат")}
            </button>
            {CONTACT.phone ? (
              <a href={`tel:${CONTACT.phone}`} className="flex items-center justify-center gap-2 rounded-xl bg-muted py-3 text-sm font-bold hover:bg-border">
                <Phone className="size-4" />
                {CONTACT.phone}
              </a>
            ) : (
              <span className="flex items-center justify-center gap-2 rounded-xl bg-muted py-3 text-sm font-bold text-muted-foreground">
                <Phone className="size-4" />—
              </span>
            )}
          </div>
        </aside>
      </Container>

      {verifying && token && (
        <EmailCodeDialog
          email={verifying}
          token={token}
          onClose={() => setVerifying(null)}
          onVerified={(next) => {
            setVerifying(null);
            setUser(next);
            setForm((f) => ({ ...f, email: next.email ?? f.email }));
          }}
        />
      )}

      <Container className="mt-10">
        <section id="alerts" className="grid scroll-mt-24 gap-5 rounded-[28px] bg-dark px-6 py-8 text-white md:grid-cols-[1fr_1.2fr] md:items-center md:px-10 md:py-10">
          <div>
            <span className="eyebrow inline-flex items-center gap-1.5 rounded-full bg-dark-2 px-3 py-1.5 text-primary">
              <Mail className="size-3.5" />
              {t("И-мэйлээр мэдээлэл авах")}
            </span>
            <h2 className="mt-4 font-display text-2xl font-bold tracking-tight md:text-[30px]">{t("Шинэ зарын мэдээлэл")}</h2>
            <p className="mt-2 text-sm text-white/70">{t("Шинээр орсон машинуудын жагсаалт и-мэйл рүү тань тогтмол очно. Хүссэн үедээ бүртгэлээс гарах боломжтой.")}</p>
          </div>
          <EmailSignup />
        </section>
      </Container>
    </>
  );
}

export default function HelpPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <HelpInner />
    </Suspense>
  );
}
