"use client";

import Container from "@/components/common/Container";
import { Field, inputClass } from "@/components/common/Field";
import { LoadingState } from "@/components/common/States";
import { CONTACT } from "@/lib/api/config";
import type { MessageKey } from "@/lib/i18n/messages";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { CreditCard, MessageCircle, Minus, Phone, Plus, Search, ShieldCheck } from "lucide-react";
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
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    message: topic === "leasing" ? `${t("Лизингийн хүсэлт")}${car ? ` — ${t("зар #{id}", { id: car })}` : ""}\n` : "",
  });

  const faq = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? FAQ.filter((f) => (t(f.q) + t(f.a)).toLowerCase().includes(q)) : FAQ;
  }, [query, t]);

  // No contact endpoint on the backend yet, so the form opens the user's mail app.
  const mailto = CONTACT.email
    ? `mailto:${CONTACT.email}?subject=${encodeURIComponent(`Baagii Car Dealer — ${t("асуулт")}`)}&body=${encodeURIComponent(`${form.message}\n\n${[form.name, form.phone, form.email].filter(Boolean).join(" · ")}`)}`
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
          <p className="mt-1.5 text-sm text-muted-foreground">{t("Хариулт олдсонгүй бол бичээрэй. Ажлын цагаар хариулна.")}</p>
          <div className="mt-5 space-y-4">
            <Field label={t("Нэр")}>
              <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label={t("Утас")}>
              <input
                className={inputClass}
                inputMode="numeric"
                autoComplete="tel"
                maxLength={8}
                placeholder={t("Утасны дугаар")}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })}
              />
            </Field>
            <Field label={t("И-мэйл")}>
              <input
                className={inputClass}
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
            <Field label={t("Асуулт")}>
              <textarea className={cn(inputClass, "h-auto min-h-28 py-3")} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            </Field>
            {mailto ? (
              <a href={mailto} className="block rounded-xl bg-primary py-3.5 text-center font-bold text-white hover:bg-primary-hover">
                {t("Илгээх")}
              </a>
            ) : (
              <p className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">{t("Холбоо барих и-мэйл тохируулаагүй байна (NEXT_PUBLIC_CONTACT_EMAIL).")}</p>
            )}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2 border-t border-border pt-5">
            <Link href="/chat" className="flex items-center justify-center gap-2 rounded-xl bg-muted py-3 text-sm font-bold hover:bg-border">
              <MessageCircle className="size-4" />
              {t("Чат")}
            </Link>
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
    </>
  );
}

export default function HelpPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <HelpInner />
    </Suspense>
  );
}
