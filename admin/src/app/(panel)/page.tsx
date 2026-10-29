"use client";

import CarImage from "@/components/car/CarImage";
import { CarLinesSkeleton, ErrorState, StatsSkeleton } from "@/components/common/States";
import { countOf, featuredCars, recentCars, topCars } from "@/lib/api/admin";
import type { Car } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/AuthProvider";
import { CAR_STATUS, ROLES } from "@/lib/constants";
import { useApi } from "@/lib/useApi";
import { withFrom } from "@/lib/useBackTo";
import { carTitle, cn, formatPriceShort } from "@/lib/utils";
import { ArrowRight, CarFront, Eye, Phone, Store, Users } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

async function loadStats(isAdmin: boolean) {
  const [pending, active, sold, featured, total, dealers, users] = await Promise.all([
    countOf("cars", [["status", "=", "pending"]]),
    countOf("cars", [["status", "=", "active"]]),
    countOf("cars", [["status", "=", "sold"]]),
    countOf("cars", [["status", "=", "active"], ["is_featured", "=", 1]]),
    countOf("cars", [["status", "<>", "deleted"]]),
    // Dealers and customers are admin-only data; car counts are scoped to the dealer by the backend.
    isAdmin ? countOf("dealers", [["status", "<>", "deleted"]]) : Promise.resolve(0),
    isAdmin ? countOf("customers", [["status", "=", "active"]]) : Promise.resolve(0),
  ]);
  return { pending, active, sold, featured, total, dealers, users };
}

export default function DashboardPage() {
  const isAdmin = useAuth().user?.role === ROLES.admin;
  const stats = useApi(() => loadStats(isAdmin), String(isAdmin));
  const recent = useApi(() => recentCars({ take: 5 }));
  // Admins see the featured ads; dealers see which of their ads are drawing interest today.
  const featured = useApi(() => (isAdmin ? featuredCars(5) : Promise.resolve(null)), String(isAdmin));
  const s = stats.data;

  // Totals (dealers, active customers, all ads) first, then ads by status (pending first: it needs action).
  const carTiles = s && [
    {
      label: "Хүлээгдэж буй",
      value: s.pending,
      href: "/cars?status=pending",
      className: s.pending > 0 ? "bg-amber-soft text-amber-ink ring-2 ring-amber" : "bg-white",
    },
    { label: "Идэвхтэй", value: s.active, href: "/cars?status=active", className: "bg-primary text-white" },
    { label: "Онцлох", value: s.featured, href: "/cars?status=featured", className: "bg-amber" },
    { label: "Зарагдсан", value: s.sold, href: "/cars?status=sold", className: "bg-dark text-white" },
  ];
  const tiles = s && [
    ...(isAdmin
      ? [
          { label: "Нийт дилер", value: s.dealers, href: withFrom("/dealers", "home"), icon: Store, className: "bg-tint-blue", iconClassName: "bg-[#2f80ed] text-white" },
          { label: "Идэвхтэй хэрэглэгч", value: s.users, href: withFrom("/customers", "home"), icon: Users, className: "bg-tint-mint", iconClassName: "bg-success text-white" },
        ]
      : []),
    { label: "Нийт зар", value: s.total, href: "/cars", icon: CarFront, className: "bg-tint-lavender", iconClassName: "bg-[#7b61ff] text-white" },
  ];

  return (
    <div className="pt-4">
      {stats.loading && !s ? (
        <StatsSkeleton admin={isAdmin} />
      ) : stats.error ? (
        <ErrorState message={stats.error.message} onRetry={stats.reload} />
      ) : (
        <div className="space-y-2">
          <div className={cn("grid gap-2", isAdmin ? "grid-cols-3" : "grid-cols-1")}>
            {tiles!.map((t) => (
              <Link key={t.label} href={t.href} className={cn("relative rounded-2xl p-3.5", t.className)}>
                <span className={cn("absolute right-3 top-3 grid size-7 place-items-center rounded-lg", t.iconClassName)}>
                  <t.icon className="size-4" strokeWidth={2.4} />
                </span>
                <p className="font-display text-2xl font-bold">{t.value}</p>
                <p className="mt-1 text-xs font-semibold opacity-80">{t.label}</p>
              </Link>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {carTiles!.map((t) => (
              <Link key={t.label} href={t.href} className={cn("rounded-2xl px-2.5 py-3", t.className)}>
                <p className="font-display text-2xl font-bold">{t.value}</p>
                <p className="mt-1 text-[11px] font-semibold leading-tight opacity-80">{t.label}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 flex items-center justify-between">
        <h2 className="font-bold">
          Сүүлийн 3 хоногт нэмэгдсэн
          {recent.data && <span className="ml-1.5 text-sm font-semibold text-muted-foreground">{recent.data.count}</span>}
        </h2>
        <Link href="/cars" className="flex items-center gap-1 text-sm font-semibold text-primary">
          Бүгд
          <ArrowRight className="size-4" />
        </Link>
      </div>
      <div className="mt-3 space-y-2">
        {recent.loading && !recent.data ? (
          <CarLinesSkeleton />
        ) : recent.error ? (
          <ErrorState message={recent.error.message} onRetry={recent.reload} />
        ) : !recent.data?.rows.length ? (
          <p className="rounded-2xl bg-card py-8 text-center text-sm text-muted-foreground">Сүүлийн 3 хоногт зар нэмэгдээгүй</p>
        ) : (
          recent.data.rows.map((car) => <CarLine key={car.id} car={car} />)
        )}
      </div>

      {isAdmin ? (
        <>
          <div className="mt-6 flex items-center justify-between">
            <h2 className="font-bold">
              Онцлох зарууд
              {featured.data && <span className="ml-1.5 text-sm font-semibold text-muted-foreground">{featured.data.count}</span>}
            </h2>
            <Link href="/cars?status=featured" className="flex items-center gap-1 text-sm font-semibold text-primary">
              Бүгд
              <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="mt-3 space-y-2">
            {featured.loading && !featured.data ? (
              <CarLinesSkeleton />
            ) : featured.error ? (
              <ErrorState message={featured.error.message} onRetry={featured.reload} />
            ) : !featured.data?.rows.length ? (
              <p className="rounded-2xl bg-card py-8 text-center text-sm text-muted-foreground">Онцлох зар алга</p>
            ) : (
              featured.data.rows.map((car) => <CarLine key={car.id} car={car} />)
            )}
          </div>
        </>
      ) : (
        <>
          <TopCars kind="view" title="Хамгийн их хандалттай" />
          <TopCars kind="phone" title="Хамгийн их дугаар харсан" />
        </>
      )}
    </div>
  );
}

/** A dealer's ads with the most views / phone-number reveals of all time. */
function TopCars({ kind, title }: { kind: "view" | "phone"; title: string }) {
  const top = useApi(() => topCars(kind, 5), kind);
  const Icon = kind === "phone" ? Phone : Eye;
  return (
    <>
      <h2 className="mt-6 font-bold">{title}</h2>
      <div className="mt-3 space-y-2">
        {top.loading && !top.data ? (
          <CarLinesSkeleton />
        ) : top.error ? (
          <ErrorState message={top.error.message} onRetry={top.reload} />
        ) : !top.data?.rows.length ? (
          <p className="rounded-2xl bg-card py-8 text-center text-sm text-muted-foreground">
            {kind === "phone" ? "Дугаар харсан зар алга" : "Үзсэн зар алга"}
          </p>
        ) : (
          top.data.rows.map((row) => (
            <CarLine
              key={row.id}
              car={row}
              count={
                <span className="flex items-center gap-1 text-sm font-bold">
                  <Icon className="size-3.5 text-muted-foreground" />
                  {kind === "phone" ? row.phone_view_count ?? 0 : row.view_count ?? 0}
                </span>
              }
            />
          ))
        )}
      </div>
    </>
  );
}

type CarLineData = Pick<
  Car,
  "id" | "image" | "body_type_name" | "status" | "price" | "dealer_name" | "seller_name" | "phonenumber" | "name" | "brand_name" | "model_name" | "manufactured_year" | "imported_year"
>;

/** An ad in the Самбар's lists; opens it with the back button leading here. `count` replaces the status badge. */
function CarLine({ car, count }: { car: CarLineData; count?: ReactNode }) {
  const st = CAR_STATUS[car.status] ?? CAR_STATUS.active;
  return (
    <Link href={withFrom(`/cars/${car.id}`, "home")} className="flex items-center gap-3 rounded-2xl bg-card p-2.5">
      <CarImage id={car.id} image={car.image} bodyType={car.body_type_name} size="thumb" className="h-12 w-16 shrink-0" artClassName="w-[80%]" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">{carTitle(car)}</p>
        <p className="text-xs text-muted-foreground">
          {formatPriceShort(car.price)} · {car.dealer_name || car.seller_name || car.phonenumber}
        </p>
      </div>
      {count ?? <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", st.className)}>{st.label}</span>}
    </Link>
  );
}
