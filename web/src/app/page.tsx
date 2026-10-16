"use client";

import BodyTypeTabs from "@/components/car/BodyTypeTabs";
import CarArt, { shapeFor } from "@/components/car/CarArt";
import CarCard, { carTitle } from "@/components/car/CarCard";
import Container, { SectionTitle, ViewAll } from "@/components/common/Container";
import { CardGridSkeleton, EmptyState, ErrorState } from "@/components/common/States";
import HeroSearch from "@/components/home/HeroSearch";
import { featuredCars, getBodyTypes, getBrands, searchCars } from "@/lib/api/cars";
import { remoteImage, uploadUrl } from "@/lib/api/config";
import type { Car } from "@/lib/api/types";
import { useApi } from "@/lib/useApi";
import { cn, formatPriceShort } from "@/lib/utils";
import { ArrowRight, CreditCard, Heart, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const MLN = 1_000_000;

const QUICK = [
  { icon: Search, tint: "bg-tint-blue text-[#2b7bd8]", title: "Машин хайх", text: "Бүх зарыг шүүж үзэх", href: "/cars" },
  { icon: Plus, tint: "bg-tint-peach text-primary", title: "Машинаа зарах", text: "Зараа 3 алхамаар нийтлэх", href: "/sell" },
  { icon: CreditCard, tint: "bg-tint-lavender text-[#6b4fd8]", title: "Лизинг", text: "Сарын төлбөрөө тооцоолох", href: "/leasing" },
  { icon: Heart, tint: "bg-tint-rose text-destructive", title: "Хадгалсан", text: "Таалагдсан машинууд", href: "/saved" },
];

const BUDGETS = [
  { label: "30 сая хүртэл", min: 0, max: 30, tint: "bg-tint-blue" },
  { label: "30 – 60 сая", min: 30, max: 60, tint: "bg-tint-lavender" },
  { label: "60 – 100 сая", min: 60, max: 100, tint: "bg-tint-rose" },
  { label: "100 сая +", min: 100, max: 0, tint: "bg-tint-mint" },
];

const STEPS = [
  { n: "01", title: "Мэдээлэл оруулах", text: "Үйлдвэр, загвар, он, гүйлтээ сонгоно." },
  { n: "02", title: "Зураг нэмэх", text: "Олон зураг нэмж, машинаа бүрэн харуулна." },
  { n: "03", title: "Нийтлэх", text: "Зар шууд гарч, худалдан авагч холбогдоно." },
];

/** Hero visual: the top featured ad's photo when there is one, else the line-art car. */
function HeroCar({ car }: { car?: Car }) {
  const photo = uploadUrl(car?.image, "full");
  return (
    <div className="relative mx-auto aspect-[4/3] w-full max-w-[640px]">
      <div className="absolute right-[4%] top-[2%] size-[78%] rounded-full bg-gradient-to-br from-white to-[#dcecfb]" />
      <div className="absolute right-[10%] top-[-4%] size-24 rounded-full border-[10px] border-primary/90 md:size-32 md:border-[14px]" />
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element -- backend-served uploads
        <img src={photo} alt={carTitle(car!)} className="absolute inset-x-0 bottom-[6%] mx-auto max-h-[80%] w-[92%] rounded-3xl object-cover shadow-2xl shadow-black/20" />
      ) : (
        <CarArt shape={shapeFor(car?.body_type_name ?? "SUV")} className="absolute inset-x-0 bottom-[10%] mx-auto w-[96%] text-dark" strokeWidth={1.8} />
      )}
      {car && (
        <Link href={`/cars/${car.id}`} className="absolute bottom-0 left-[4%] flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-xl shadow-black/10">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-white">
            <ArrowRight className="size-4" />
          </span>
          <span>
            <span className="block text-sm font-bold">{carTitle(car)}</span>
            <span className="block text-xs font-semibold text-primary">{formatPriceShort(car.price)}</span>
          </span>
        </Link>
      )}
    </div>
  );
}

/** "Онцлох" strip at the hero's right edge, like the reference's top-selling column. */
function TopStrip({ cars }: { cars: Car[] }) {
  if (cars.length < 2) return null;
  return (
    <div className="absolute right-6 top-1/2 hidden w-36 -translate-y-1/2 space-y-2 rounded-2xl bg-white/80 p-2 shadow-xl shadow-black/5 backdrop-blur 2xl:block">
      <p className="px-1 pt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Онцлох</p>
      {cars.slice(1, 4).map((c) => (
        <Link key={c.id} href={`/cars/${c.id}`} className="block rounded-xl bg-white p-2 text-center hover:shadow-md">
          <CarArt shape={shapeFor(c.body_type_name)} className="mx-auto w-16" strokeWidth={3} />
          <p className="mt-1 truncate text-xs font-bold">{carTitle(c)}</p>
          <p className="text-[11px] text-primary">{formatPriceShort(c.price)}</p>
        </Link>
      ))}
    </div>
  );
}

function Hero({ featured }: { featured: Car[] }) {
  return (
    <section className="relative">
      {/* Full-bleed, viewport-tall hero on a bright sky gradient. */}
      <div className="relative overflow-hidden bg-[linear-gradient(180deg,#e3f0fb_0%,#f2f8fd_45%,#ffffff_100%)] lg:min-h-[min(calc(100svh-76px),820px)]">
        <div
          aria-hidden
          className="absolute left-[3%] top-[12%] hidden h-40 w-56 opacity-60 md:block"
          style={{ backgroundImage: "radial-gradient(#c5d3e0 1.6px, transparent 1.6px)", backgroundSize: "18px 18px" }}
        />
        <div aria-hidden className="absolute -bottom-24 -left-24 size-72 rounded-full border-[18px] border-primary/10" />
        <Container className="relative grid items-center gap-8 pb-56 pt-10 sm:pb-40 md:pt-16 lg:min-h-[min(calc(100svh-76px),820px)] lg:grid-cols-[0.95fr_1.05fr] lg:pb-36 lg:pt-10">
          <div>
            <p className="kicker text-foreground/60">Шинэ · Хуучин · Лизинг</p>
            <h1 className="mt-4 font-display text-[52px] font-light leading-[0.98] sm:text-[68px] xl:text-[88px]">
              Мөрөөдлийн
              <br />
              машинаа <span className="font-bold text-primary">олоорой</span>
            </h1>
            <p className="mt-6 max-w-md text-[15px] leading-7 text-foreground/70">
              Улаанбаатарын машины зарууд нэг дор. Шүүж хайх, лизингээ тооцоолох, зарлагчтай шууд холбогдох.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/cars" className="rounded-xl bg-primary px-6 py-3.5 text-sm font-bold uppercase tracking-[0.08em] text-white shadow-lg shadow-primary/30 hover:bg-primary-hover">
                Машин хайх
              </Link>
              <Link href="/sell" className="rounded-xl bg-dark px-6 py-3.5 text-sm font-bold uppercase tracking-[0.08em] text-white hover:bg-dark-2">
                Машинаа зарах
              </Link>
            </div>
          </div>
          <div className="hidden md:block">
            <HeroCar car={featured[0]} />
          </div>
        </Container>
        <TopStrip cars={featured} />
      </div>
      <Container className="absolute inset-x-0 bottom-0 translate-y-1/2 lg:translate-y-[38%]">
        <HeroSearch />
      </Container>
    </section>
  );
}

function BrandGrid() {
  const brands = useApi(getBrands);
  if (!brands.data?.length) return null;
  return (
    <Container className="mt-20 md:mt-28">
      <SectionTitle kicker="Бүх үйлдвэр" light="Машины" bold="брэнд" action={<ViewAll href="/cars" />} />
      <div className="mt-8 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {brands.data.slice(0, 16).map((b, i) => {
          const logo = remoteImage(b.logo);
          return (
            <Link
              key={b.id}
              href={`/cars?brand=${b.id}`}
              className={cn(
                "group flex-col items-center gap-3 rounded-2xl bg-card px-3 pb-4 pt-5 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/5",
                // 3×3 on phones; the full 16 from sm up.
                i < 9 ? "flex" : "hidden sm:flex"
              )}
            >
              <span className="grid size-14 place-items-center">
                {logo ? (
                  // eslint-disable-next-line @next/next/no-img-element -- seeded remote logos
                  <img src={logo} alt="" loading="lazy" className="max-h-12 max-w-12 object-contain opacity-80 grayscale transition group-hover:opacity-100 group-hover:grayscale-0" />
                ) : (
                  <span className="font-display text-3xl font-bold text-foreground/70">{b.name[0]}</span>
                )}
              </span>
              <span className="text-center text-[13px] font-semibold text-foreground/80">{b.name}</span>
            </Link>
          );
        })}
      </div>
    </Container>
  );
}

function Budgets() {
  const counts = useApi(() =>
    Promise.all(
      BUDGETS.map((b) =>
        searchCars({ priceMin: b.min ? b.min * MLN : undefined, priceMax: b.max ? b.max * MLN : undefined, pageSize: 1 }).then((r) => r.count)
      )
    )
  );
  return (
    <Container className="mt-20 md:mt-28">
      <SectionTitle light="Төсвөөрөө" bold="сонго" />
      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {BUDGETS.map((b, i) => {
          const q = new URLSearchParams();
          if (b.min) q.set("priceMin", String(b.min));
          if (b.max) q.set("priceMax", String(b.max));
          return (
            <Link key={b.label} href={`/cars?${q}`} className={cn("group relative overflow-hidden rounded-2xl p-5 md:p-6", b.tint)}>
              <p className="font-display text-xl font-semibold md:text-2xl">{b.label}</p>
              <p className="mt-1 text-sm text-foreground/60">{counts.data ? `${counts.data[i]} машин` : " "}</p>
            </Link>
          );
        })}
      </div>
    </Container>
  );
}

export default function HomePage() {
  const router = useRouter();
  const bodyTypes = useApi(getBodyTypes);
  const featured = useApi(() => featuredCars(6));

  return (
    <>
      <Hero featured={featured.data ?? []} />

      {/* Space for the overlapping search card (taller when it stacks). */}
      <div className="h-[210px] sm:h-[150px] lg:h-[80px]" />

      <Container className="mt-10">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {QUICK.map(({ icon: Icon, tint, title, text, href }) => (
            <Link key={title} href={href} className="group flex items-center gap-4 rounded-2xl bg-card p-4 transition hover:shadow-xl hover:shadow-black/5 md:p-5">
              <span className={cn("grid size-12 shrink-0 place-items-center rounded-xl", tint)}>
                <Icon className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block font-display text-base font-semibold md:text-lg">{title}</span>
                <span className="hidden text-xs text-muted-foreground sm:block">{text}</span>
              </span>
              <ArrowRight className="ml-auto hidden size-4 text-muted-foreground transition-transform group-hover:translate-x-1 md:block" />
            </Link>
          ))}
        </div>
      </Container>

      <Container className="mt-20 md:mt-28">
        <SectionTitle kicker="Онцлох" light="Онцлох" bold="машинууд" action={<ViewAll href="/cars" />} />
        <div className="mt-8">
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
            <EmptyState
              title="Одоогоор зар алга"
              description="Анхны зараа нэмээрэй."
              action={<Link href="/sell" className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white">Зар нэмэх</Link>}
            />
          )}
        </div>
      </Container>

      <BrandGrid />

      <Container className="mt-20 md:mt-28">
        <SectionTitle kicker="Биеийн хэлбэр" light="Хэлбэрээр" bold="хайх" />
        <BodyTypeTabs className="mt-8" items={bodyTypes.data ?? []} onSelect={(id) => id && router.push(`/cars?body=${id}`)} />
      </Container>

      <Budgets />

      {/* Full-bleed banner, like the reference's "Don't dream it, drive it". */}
      <section className="relative mt-20 overflow-hidden bg-[linear-gradient(110deg,#eef3f8_0%,#f8fafc_55%,#e6eef6_100%)] md:mt-28">
        <CarArt className="pointer-events-none absolute -right-16 bottom-0 hidden w-[46%] text-foreground/10 lg:block" strokeWidth={1.2} />
        <Container className="relative grid gap-10 py-16 md:py-24 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <p className="kicker">Машинаа зарах</p>
            <h2 className="mt-3 font-display text-[44px] font-light leading-[0.98] md:text-[64px]">
              Мөрөөдөх биш,
              <br />
              <span className="font-bold text-primary">жолоод</span>
            </h2>
            <p className="mt-5 max-w-md text-[15px] leading-7 text-foreground/70">Зураг, мэдээллээ оруулаад нийтэл. Худалдан авагчид шууд холбогдоно.</p>
            <Link href="/sell" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-dark px-6 py-3.5 text-sm font-bold uppercase tracking-[0.08em] text-white hover:bg-dark-2">
              Зар нэмэх
              <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-2xl bg-white p-6 shadow-xl shadow-black/5">
                <p className="font-display text-4xl font-bold text-primary">{s.n}</p>
                <p className="mt-4 font-display text-lg font-semibold">{s.title}</p>
                <p className="mt-1.5 text-[13px] leading-5 text-muted-foreground">{s.text}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
