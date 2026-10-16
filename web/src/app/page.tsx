"use client";

import BodyTypeTabs from "@/components/car/BodyTypeTabs";
import CarArt from "@/components/car/CarArt";
import CarCard from "@/components/car/CarCard";
import Container from "@/components/common/Container";
import { CardGridSkeleton, EmptyState, ErrorState } from "@/components/common/States";
import HeroSearch from "@/components/home/HeroSearch";
import { featuredCars, getBodyTypes } from "@/lib/api/cars";
import { useApi } from "@/lib/useApi";
import { Bell, CreditCard, MessageCircle, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const FEATURES = [
  { icon: ShieldCheck, tint: "bg-tint-mint text-success", title: "Шалгагдсан зар", text: "Зарлагчийн утас баталгаажсан, онцлох зарыг админ шалгаж тэмдэглэнэ." },
  { icon: CreditCard, tint: "bg-tint-peach text-amber-ink", title: "Зээл, лизинг", text: "Сарын төлбөрөө шууд тооцоолж, хүсэлтээ онлайнаар илгээнэ." },
  { icon: MessageCircle, tint: "bg-tint-blue text-primary", title: "Шууд холбогдох", text: "Зарлагчтай утсаар эсвэл чатаар шууд холбогдоно." },
  { icon: Bell, tint: "bg-tint-lavender text-[#5b3fae]", title: "Хадгалсан зар", text: "Таалагдсан машинаа хадгалаад дараа нь эргэн харна." },
];

const STEPS = [
  { n: "01", title: "Мэдээлэл оруулах", text: "Үйлдвэр, загвар, он, гүйлтээ сонгоно." },
  { n: "02", title: "Зураг нэмэх", text: "Олон зураг нэмж, машинаа бүрэн харуулна." },
  { n: "03", title: "Нийтлэх", text: "Зар шууд гарч, худалдан авагч чатлана." },
];

function Hero() {
  return (
    <Container className="pt-4 md:pt-8">
      <section className="relative">
        <div className="overflow-hidden rounded-[28px] bg-dark px-6 pb-40 pt-10 text-white sm:pb-36 md:px-14 md:pb-24 md:pt-14 lg:pb-28">
          <div className="grid items-center gap-10 md:grid-cols-[1.05fr_1fr]">
            <div>
              <span className="eyebrow inline-block rounded-full bg-dark-2 px-3 py-1.5 text-amber">Машин авах · зарах · лизинг</span>
              <h1 className="mt-6 font-display text-[40px] font-bold leading-[1.02] tracking-tight md:text-[60px]">
                Мөрөөдлийн машинаа <span className="text-amber">олоорой</span>
              </h1>
              <p className="mt-5 max-w-md text-[15px] leading-6 text-white/80">
                Шалгагдсан зарууд, зээлийн тооцоолуур, зарлагчтай шууд холбогдох боломж. Машинаа хурдан, аюулгүй ав, зар.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/cars" className="rounded-xl bg-primary px-5 py-3.5 text-sm font-bold hover:bg-primary-hover">
                  Машин хайх
                </Link>
                <Link href="/sell" className="rounded-xl border-[1.5px] border-white px-5 py-3.5 text-sm font-bold hover:bg-white hover:text-dark">
                  Машинаа зарах
                </Link>
              </div>
            </div>
            <div className="relative mx-auto hidden aspect-square w-full max-w-[380px] md:block">
              <div className="absolute inset-[6%] rounded-full bg-primary" />
              <CarArt className="absolute left-[-14%] top-[30%] w-[128%] text-amber" strokeWidth={2.4} />
              <span className="absolute bottom-[8%] left-[-6%] flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 text-xs font-bold text-foreground shadow-lg">
                <span className="grid size-6 place-items-center rounded-md bg-tint-mint text-success">
                  <ShieldCheck className="size-3.5" />
                </span>
                Шалгагдсан зар
              </span>
            </div>
          </div>
        </div>
        <div className="absolute inset-x-3 bottom-0 translate-y-1/2 md:inset-x-6 lg:translate-y-[40%]">
          <HeroSearch />
        </div>
      </section>
    </Container>
  );
}

export default function HomePage() {
  const router = useRouter();
  const bodyTypes = useApi(getBodyTypes);
  const featured = useApi(() => featuredCars(6));

  return (
    <>
      <Hero />

      {/* Space for the overlapping search strip (taller when it stacks). */}
      <div className="h-[290px] sm:h-[170px] lg:h-[70px]" />

      <Container className="mt-10 md:mt-16">
        <h2 className="flex items-center gap-3 font-display text-2xl font-bold tracking-tight md:text-[34px]">
          Биеийн хэлбэрээр
          {bodyTypes.data && (
            <span className="rounded-md bg-primary px-2 py-1 font-sans text-sm font-bold tracking-normal text-white">
              {bodyTypes.data.reduce((n, b) => n + (b.car_count ?? 0), 0)} зар
            </span>
          )}
        </h2>
        <BodyTypeTabs className="mt-6" items={bodyTypes.data ?? []} onSelect={(id) => id && router.push(`/cars?body=${id}`)} />
      </Container>

      <Container className="mt-14 md:mt-20">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight md:text-[34px]">Онцлох зарууд</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">Админ шалгаж онцолсон, зарлагч нь баталгаажсан машинууд</p>
          </div>
          <Link href="/cars" className="hidden shrink-0 rounded-xl border-[1.5px] border-foreground px-4 py-2.5 text-sm font-bold hover:bg-white sm:block">
            Бүгдийг харах
          </Link>
        </div>
        <div className="mt-6">
          {featured.loading && !featured.data ? (
            <CardGridSkeleton count={3} />
          ) : featured.error ? (
            <ErrorState message={featured.error.message} onRetry={featured.reload} />
          ) : featured.data?.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featured.data.map((car) => (
                <CarCard key={car.id} car={car} featuredBadge />
              ))}
            </div>
          ) : (
            <EmptyState title="Одоогоор зар алга" description="Анхны зараа нэмээрэй." action={<Link href="/sell" className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white">Зар нэмэх</Link>} />
          )}
        </div>
        <Link href="/cars" className="mt-4 block rounded-xl border-[1.5px] border-foreground py-3 text-center text-sm font-bold sm:hidden">
          Бүгдийг харах
        </Link>
      </Container>

      <Container className="mt-14 md:mt-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, tint, title, text }) => (
            <div key={title} className="rounded-2xl bg-card p-6">
              <span className={`grid size-11 place-items-center rounded-xl ${tint}`}>
                <Icon className="size-5" />
              </span>
              <h3 className="mt-5 font-bold">{title}</h3>
              <p className="mt-2 text-[13px] leading-5 text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </Container>

      <Container className="mt-14 md:mt-20">
        <section className="grid gap-8 rounded-[28px] bg-amber p-7 md:p-12 lg:grid-cols-[1fr_1.15fr] lg:items-center">
          <div>
            <h2 className="font-display text-[28px] font-bold leading-tight tracking-tight md:text-4xl">Машинаа 3 алхамаар зараарай</h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-foreground/80">
              Зураг, мэдээллээ оруулаад нийтэл. Худалдан авагчид чатаар шууд холбогдоно.
            </p>
            <Link href="/sell" className="mt-7 inline-block rounded-xl bg-dark px-5 py-3.5 text-sm font-bold text-white hover:bg-dark-2">
              Зар нэмэх
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-2xl bg-white p-5">
                <p className="font-display text-3xl font-bold">{s.n}</p>
                <p className="mt-3 text-sm font-bold">{s.title}</p>
                <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{s.text}</p>
              </div>
            ))}
          </div>
        </section>
      </Container>
    </>
  );
}
