"use client";

import Container from "@/components/common/Container";
import type { BodyType } from "@/lib/api/types";
import type { MessageKey } from "@/lib/i18n/messages";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

interface Slide {
  /** Basename in /public/hero (`<name>.webp` 1920w, `<name>-sm.webp` 900w). */
  image: string;
  /** Where the car sits in the photo, so `object-cover` keeps it in frame. */
  focus: string;
  kicker: MessageKey;
  light: MessageKey;
  bold: MessageKey;
  text: MessageKey;
  cta: MessageKey;
  /** Static link, or a body-type name resolved to `/cars?body=<id>`. */
  href?: string;
  bodyType?: string;
}

// Photos: Unsplash (free licence) — see public/hero/CREDITS.md.
const SLIDES: Slide[] = [
  {
    image: "suv-desert",
    focus: "68% 62%",
    kicker: "Жийп · SUV",
    light: "Аянд гарах",
    bold: "жийпээ олоорой",
    text: "Land Cruiser, Prado, Lexus LX — Монголын замд тэсвэртэй машинууд нэг дор.",
    cta: "Жийп үзэх",
    bodyType: "SUV",
  },
  {
    image: "crossover-snow",
    focus: "72% 58%",
    kicker: "Өвөлд бэлэн",
    light: "Хүйтэнд ч",
    bold: "найдвартай",
    text: "4WD, AWD хөтлөгчтэй кроссовер, жийпүүд — хальтиргаатай замд итгэлтэй.",
    cta: "Машин хайх",
    href: "/cars",
  },
  {
    image: "electric-road",
    focus: "60% 62%",
    kicker: "Хэмнэлттэй",
    light: "Хайбрид,",
    bold: "цахилгаан",
    text: "Шатахуунд бага зарцуулдаг Prius, Aqua болон цахилгаан машинууд.",
    cta: "Хайбрид үзэх",
    href: `/cars?fuel=${encodeURIComponent("Хайбрид,Цахилгаан")}`,
  },
  {
    image: "coupe-forest",
    focus: "70% 62%",
    kicker: "Машинаа зарах",
    light: "Зараа",
    bold: "3 алхамаар",
    text: "Зураг, мэдээллээ оруулаад нийтэл. Худалдан авагчид шууд холбогдоно.",
    cta: "Зар нэмэх",
    href: "/sell",
  },
];

const INTERVAL = 6000;

function slideHref(slide: Slide, bodyTypes: BodyType[]) {
  if (slide.bodyType) {
    const id = bodyTypes.find((b) => b.name.toLowerCase() === slide.bodyType!.toLowerCase())?.id;
    return id ? `/cars?body=${id}` : "/cars";
  }
  return slide.href ?? "/cars";
}

/** Full-bleed photo carousel for the top of the home page. */
export default function HeroCarousel({ bodyTypes, className }: { bodyTypes: BodyType[]; className?: string }) {
  const { t } = useI18n();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = SLIDES.length;
  const go = useCallback((d: number) => setIndex((i) => (i + d + count) % count), [count]);

  // Auto-advance, unless paused (hover / focus) or the user prefers less motion.
  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setTimeout(() => go(1), INTERVAL);
    return () => window.clearTimeout(t);
  }, [index, paused, go]);

  return (
    <div
      className={cn("relative overflow-hidden bg-[#e9f1f8]", className)}
      role="region"
      aria-roledescription="carousel"
      aria-label={t("Онцлох санал")}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") go(-1);
        if (e.key === "ArrowRight") go(1);
      }}
    >
      {SLIDES.map((s, i) => (
        <div key={s.image} aria-hidden={i !== index} className={cn("absolute inset-0 transition-opacity duration-700", i === index ? "opacity-100" : "opacity-0")}>
          {/* eslint-disable-next-line @next/next/no-img-element -- static responsive photo */}
          <img
            src={`/hero/${s.image}.webp`}
            srcSet={`/hero/${s.image}-sm.webp 900w, /hero/${s.image}.webp 1920w`}
            sizes="100vw"
            alt=""
            loading={i === 0 ? "eager" : "lazy"}
            fetchPriority={i === 0 ? "high" : "auto"}
            className={cn("size-full object-cover transition-transform duration-[7000ms] ease-out", i === index ? "scale-105" : "scale-100")}
            style={{ objectPosition: s.focus }}
          />
        </div>
      ))}

      {/* Bright wash so dark text reads on any photo: top-down on phones, left-to-right from md. */}
      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/75 to-white/10 md:bg-gradient-to-r md:from-white/95 md:via-white/70 md:to-transparent md:to-70%" />

      <Container className="relative flex h-full flex-col justify-start pt-10 md:justify-center md:pb-16 md:pt-0">
        {SLIDES.map((s, i) => (
          <div key={s.image} className={cn(i === index ? "block" : "hidden")} aria-live="polite">
            <div key={index} className="max-w-xl animate-[heroIn_600ms_ease-out]">
              <p className="kicker text-foreground/70">{t(s.kicker)}</p>
              <h1 className="mt-3 font-display text-[44px] font-light leading-[0.98] sm:text-[56px] lg:text-[72px]">
                {t(s.light)}
                <br />
                <span className="font-bold text-primary">{t(s.bold)}</span>
              </h1>
              <p className="mt-4 max-w-md text-[15px] leading-7 text-foreground/80">{t(s.text)}</p>
              <Link
                href={slideHref(s, bodyTypes)}
                className="mt-6 inline-block rounded-xl bg-primary px-6 py-3.5 text-sm font-bold uppercase tracking-[0.08em] text-white shadow-lg shadow-primary/30 hover:bg-primary-hover"
              >
                {t(s.cta)}
              </Link>
            </div>
          </div>
        ))}
      </Container>

      {/* Controls sit above the overlapping search card. */}
      <Container className="absolute inset-x-0 bottom-[68px] flex items-center justify-end gap-3 lg:bottom-[72px]">
        <div className="flex gap-1.5 rounded-full bg-white/80 px-2.5 py-2 shadow-sm backdrop-blur">
          {SLIDES.map((s, i) => (
            <button
              key={s.image}
              onClick={() => setIndex(i)}
              aria-label={t("{n}-р слайд", { n: i + 1 })}
              aria-current={i === index}
              className={cn("h-1.5 rounded-full transition-all", i === index ? "w-8 bg-primary" : "w-4 bg-foreground/20 hover:bg-foreground/40")}
            />
          ))}
        </div>
        <button onClick={() => go(-1)} aria-label={t("Өмнөх")} className="hidden size-10 place-items-center rounded-full bg-white/90 shadow-md hover:bg-white sm:grid">
          <ChevronLeft className="size-5" />
        </button>
        <button onClick={() => go(1)} aria-label={t("Дараах")} className="hidden size-10 place-items-center rounded-full bg-white/90 shadow-md hover:bg-white sm:grid">
          <ChevronRight className="size-5" />
        </button>
      </Container>
    </div>
  );
}
