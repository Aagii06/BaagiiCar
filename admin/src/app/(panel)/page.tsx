"use client";

import CarImage from "@/components/car/CarImage";
import { ErrorState, LoadingState, Spinner } from "@/components/common/States";
import { countOf, recentCars } from "@/lib/api/admin";
import { useAuth } from "@/lib/auth/AuthProvider";
import { CAR_STATUS, ROLES } from "@/lib/constants";
import { useApi } from "@/lib/useApi";
import { cn, formatPriceShort } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const RECENT_PAGE = 10;

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
  const [recentTake, setRecentTake] = useState(RECENT_PAGE);
  const recent = useApi(() => recentCars({ take: recentTake }), String(recentTake));
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
          { label: "Нийт дилер", value: s.dealers, href: "/dealers", className: "bg-white" },
          { label: "Идэвхтэй хэрэглэгч", value: s.users, href: "/customers", className: "bg-white" },
        ]
      : []),
    { label: "Нийт зар", value: s.total, href: "/cars", className: "bg-white" },
  ];

  return (
    <div className="pt-4">
      {stats.loading && !s ? (
        <LoadingState />
      ) : stats.error ? (
        <ErrorState message={stats.error.message} onRetry={stats.reload} />
      ) : (
        <div className="space-y-2">
          <div className={cn("grid gap-2", isAdmin ? "grid-cols-3" : "grid-cols-1")}>
            {tiles!.map((t) => (
              <Link key={t.label} href={t.href} className={cn("rounded-2xl p-3.5", t.className)}>
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
          Сүүлийн 2 хоногт нэмэгдсэн
          {recent.data && <span className="ml-1.5 text-sm font-semibold text-muted-foreground">{recent.data.count}</span>}
        </h2>
        <Link href="/cars" className="flex items-center gap-1 text-sm font-semibold text-primary">
          Бүгд
          <ArrowRight className="size-4" />
        </Link>
      </div>
      <div className="mt-3 space-y-2">
        {recent.loading && !recent.data ? (
          <LoadingState className="py-8" />
        ) : recent.error ? (
          <ErrorState message={recent.error.message} onRetry={recent.reload} />
        ) : !recent.data?.rows.length ? (
          <p className="rounded-2xl bg-card py-8 text-center text-sm text-muted-foreground">Сүүлийн 2 хоногт зар нэмэгдээгүй</p>
        ) : (
          recent.data.rows.map((car) => {
            const st = CAR_STATUS[car.status] ?? CAR_STATUS.active;
            return (
              <Link key={car.id} href={`/cars/${car.id}`} className="flex items-center gap-3 rounded-2xl bg-card p-2.5">
                <CarImage id={car.id} image={car.image} bodyType={car.body_type_name} size="thumb" className="h-12 w-16 shrink-0" artClassName="w-[80%]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{car.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatPriceShort(car.price)} · {car.dealer_name || car.seller_name || car.phonenumber}
                  </p>
                </div>
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", st.className)}>{st.label}</span>
              </Link>
            );
          })
        )}
        {recent.data && recent.data.rows.length < recent.data.count && (
          <button
            type="button"
            onClick={() => setRecentTake((t) => t + RECENT_PAGE)}
            disabled={recent.loading}
            className="w-full rounded-xl bg-card py-3 text-sm font-bold disabled:opacity-60"
          >
            {recent.loading ? <Spinner className="mx-auto size-5" /> : "Цааш үзэх"}
          </button>
        )}
      </div>
    </div>
  );
}
