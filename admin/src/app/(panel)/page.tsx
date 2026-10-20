"use client";

import CarImage from "@/components/car/CarImage";
import { ErrorState, LoadingState } from "@/components/common/States";
import PageHeader from "@/components/layout/PageHeader";
import { countOf, recentCars } from "@/lib/api/admin";
import { CAR_STATUS } from "@/lib/constants";
import { useApi } from "@/lib/useApi";
import { cn, formatPriceShort } from "@/lib/utils";
import { ChevronRight, Plus } from "lucide-react";
import Link from "next/link";

async function loadStats() {
  const [pending, active, sold, featured, users, brands, models] = await Promise.all([
    countOf("cars", [["status", "=", "pending"]]),
    countOf("cars", [["status", "=", "active"]]),
    countOf("cars", [["status", "=", "sold"]]),
    countOf("cars", [["status", "=", "active"], ["is_featured", "=", 1]]),
    countOf("users", [["status", "<>", "deleted"]]),
    countOf("brands", [["status", "=", "active"]]),
    countOf("carModels", [["status", "=", "active"]]),
  ]);
  return { pending, active, sold, featured, users, brands, models };
}

export default function DashboardPage() {
  const stats = useApi(loadStats);
  const recent = useApi(() => recentCars(6));
  const s = stats.data;

  const tiles = s && [
    { label: "Идэвхтэй зар", value: s.active, href: "/cars?status=active", className: "bg-primary text-white" },
    { label: "Онцлох", value: s.featured, href: "/cars?status=featured", className: "bg-amber" },
    { label: "Зарагдсан", value: s.sold, href: "/cars?status=sold", className: "bg-dark text-white" },
    { label: "Хэрэглэгч", value: s.users, href: "/users", className: "bg-white" },
    { label: "Үйлдвэр", value: s.brands, href: "/catalog", className: "bg-white" },
    { label: "Загвар", value: s.models, href: "/catalog?tab=models", className: "bg-white" },
  ];

  return (
    <>
      <PageHeader
        title="Самбар"
        aside={
          <Link href="/cars/new" className="flex items-center gap-1 rounded-xl bg-primary px-3 py-2 text-sm font-bold text-white">
            <Plus className="size-4" strokeWidth={2.6} />
            Зар
          </Link>
        }
      />
      {s && s.pending > 0 && (
        <Link href="/cars?status=pending" className="mb-3 flex items-center gap-3 rounded-2xl bg-amber-soft p-3.5 text-amber-ink">
          <span className="font-display text-2xl font-bold">{s.pending}</span>
          <span className="text-sm font-semibold">зар батлахыг хүлээж байна</span>
          <ChevronRight className="ml-auto size-4" />
        </Link>
      )}
      {stats.loading && !s ? (
        <LoadingState />
      ) : stats.error ? (
        <ErrorState message={stats.error.message} onRetry={stats.reload} />
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {tiles!.map((t) => (
            <Link key={t.label} href={t.href} className={cn("rounded-2xl p-3.5", t.className)}>
              <p className="font-display text-2xl font-bold">{t.value}</p>
              <p className="mt-1 text-xs font-semibold opacity-80">{t.label}</p>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-6 flex items-center justify-between">
        <h2 className="font-bold">Сүүлд нэмэгдсэн</h2>
        <Link href="/cars" className="text-sm font-semibold text-primary">
          Бүгд
        </Link>
      </div>
      <div className="mt-3 space-y-2">
        {recent.loading && !recent.data ? (
          <LoadingState className="py-8" />
        ) : recent.error ? (
          <ErrorState message={recent.error.message} onRetry={recent.reload} />
        ) : (
          recent.data?.map((car) => {
            const st = CAR_STATUS[car.status] ?? CAR_STATUS.active;
            return (
              <Link key={car.id} href={`/cars/${car.id}`} className="flex items-center gap-3 rounded-2xl bg-card p-2.5">
                <CarImage id={car.id} image={car.image} bodyType={car.body_type_name} size="thumb" className="h-12 w-16 shrink-0" artClassName="w-[80%]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{car.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatPriceShort(car.price)} · {car.seller_name || car.phonenumber}
                  </p>
                </div>
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", st.className)}>{st.label}</span>
              </Link>
            );
          })
        )}
      </div>
    </>
  );
}
