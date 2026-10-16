import { CONTACT } from "@/lib/api/config";
import Link from "next/link";
import Logo, { BRAND } from "./Logo";

const COLUMNS = [
  {
    title: "Машин",
    links: [
      { href: "/cars", label: "Машин авах" },
      { href: "/sell", label: "Зар нэмэх" },
      { href: "/help#faq", label: "Оношилгоо" },
      { href: "/leasing", label: "Лизинг" },
    ],
  },
  {
    title: "Тусламж",
    links: [
      { href: "/help#faq", label: "Түгээмэл асуулт" },
      { href: "/help#safety", label: "Аюулгүй худалдаа" },
      { href: "/help#contact", label: "Холбоо барих" },
    ],
  },
];

export default function Footer() {
  const contact = [
    CONTACT.phone && { label: CONTACT.phone, href: `tel:${CONTACT.phone}` },
    CONTACT.email && { label: CONTACT.email, href: `mailto:${CONTACT.email}` },
    CONTACT.address && { label: CONTACT.address },
  ].filter(Boolean) as { label: string; href?: string }[];

  return (
    <footer className="mt-16 bg-dark text-white">
      <div className="mx-auto max-w-[1280px] px-4 pb-8 pt-12 md:px-10 md:pt-16">
        <div className="grid gap-10 md:grid-cols-[1.6fr_1fr_1fr_0.8fr]">
          <div>
            <Logo dark />
            <p className="mt-4 max-w-sm text-sm leading-6 text-white/80">
              Монголын машин авах, зарах платформ. Оношилгоотой зар, зээлийн тооцоолуур, зарлагчтай шууд чат.
            </p>
            <div className="mt-5 flex gap-2">
              <span className="rounded-lg bg-dark-2 px-3 py-2 text-xs font-bold">App Store</span>
              <span className="rounded-lg bg-dark-2 px-3 py-2 text-xs font-bold">Google Play</span>
            </div>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="eyebrow text-primary">{col.title}</p>
              <ul className="mt-3 space-y-2.5 text-sm font-medium">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="hover:text-primary">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <p className="eyebrow text-primary">Холбоо</p>
            <ul className="mt-3 space-y-2.5 text-sm font-medium">
              {contact.length ? (
                contact.map((c) => (
                  <li key={c.label}>{c.href ? <a href={c.href} className="hover:text-primary">{c.label}</a> : c.label}</li>
                ))
              ) : (
                <li>
                  <Link href="/help#contact" className="hover:text-primary">
                    Бидэнд бичих
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-white/70 sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} {BRAND}</span>
          <span>Нууцлалын бодлого · Үйлчилгээний нөхцөл</span>
        </div>
      </div>
    </footer>
  );
}
