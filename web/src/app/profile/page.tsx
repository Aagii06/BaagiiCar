"use client";

import { carTitle } from "@/components/car/CarCard";
import CarImage from "@/components/car/CarImage";
import Container from "@/components/common/Container";
import RequireAuth from "@/components/common/RequireAuth";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import { deleteCar, markSold, myCars } from "@/lib/api/cars";
import type { Car } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/AuthProvider";
import type { MessageKey } from "@/lib/i18n/messages";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useApi } from "@/lib/useApi";
import { cn, formatPrice, initials, userName } from "@/lib/utils";
import { Heart, LogOut, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const STATUS: Record<string, { label: MessageKey; className: string }> = {
  active: { label: "Идэвхтэй", className: "bg-success-soft text-success" },
  sold: { label: "Зарагдсан", className: "bg-dark text-white" },
  deleted: { label: "Устгасан", className: "bg-destructive-soft text-destructive" },
};

function MyCarRow({ car, onChange }: { car: Car; onChange: () => void }) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const status = STATUS[car.status] ?? STATUS.active;

  const run = async (action: () => Promise<void>, confirmText: string) => {
    if (!window.confirm(confirmText)) return;
    setBusy(true);
    setError(null);
    try {
      await action();
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Алдаа гарлаа"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-3 rounded-2xl bg-card p-3 sm:flex-row sm:items-center", busy && "opacity-60")}>
      <Link href={`/cars/${car.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        <CarImage id={car.id} image={car.image} bodyType={car.body_type_name} size="thumb" className="h-16 w-24 shrink-0" />
        <div className="min-w-0">
          <p className="truncate font-bold">
            {carTitle(car, t)} {car.manufactured_year}
          </p>
          <p className="text-sm font-semibold text-primary">{formatPrice(car.price, t)}</p>
          <p className="text-xs text-muted-foreground">
            {t("{views} үзсэн · {saves} хадгалсан", { views: car.view_count ?? 0, saves: car.favorite_count ?? 0 })}
          </p>
        </div>
      </Link>
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold", status.className)}>{t(status.label)}</span>
        {car.status === "active" && (
          <>
            <Link href={`/sell?id=${car.id}`} className="rounded-lg bg-muted px-3 py-2 text-xs font-bold hover:bg-border">
              {t("Засах")}
            </Link>
            <button onClick={() => run(() => markSold(car.id), t("Зарагдсан гэж тэмдэглэх үү?"))} className="rounded-lg bg-muted px-3 py-2 text-xs font-bold hover:bg-border">
              {t("Зарагдсан")}
            </button>
          </>
        )}
        {car.status !== "deleted" && (
          <button onClick={() => run(() => deleteCar(car.id), t("Зарыг устгах уу?"))} className="rounded-lg bg-destructive-soft px-3 py-2 text-xs font-bold text-destructive">
            {t("Устгах")}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-destructive sm:basis-full">{error}</p>}
    </div>
  );
}

function Profile() {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const cars = useApi(() => myCars(user!.id), String(user?.id));
  const visible = (cars.data ?? []).filter((c) => c.status !== "deleted");

  return (
    <Container className="max-w-[960px] pt-8 md:pt-12">
      <section className="flex flex-wrap items-center gap-4 rounded-2xl bg-card p-5 md:p-6">
        <span className="grid size-14 place-items-center rounded-2xl bg-dark text-lg font-bold text-white">{initials(userName(user))}</span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold">{userName(user)}</h1>
          <p className="text-sm text-muted-foreground">{[user?.phonenumber, user?.email].filter(Boolean).join(" · ")}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/saved" className="flex items-center gap-1.5 rounded-xl bg-muted px-3.5 py-2.5 text-sm font-bold hover:bg-border">
            <Heart className="size-4" />
            {t("Хадгалсан")}
          </Link>
          <button
            onClick={() => {
              logout();
              router.push("/");
            }}
            className="flex items-center gap-1.5 rounded-xl bg-muted px-3.5 py-2.5 text-sm font-bold hover:bg-border"
          >
            <LogOut className="size-4" />
            {t("Гарах")}
          </button>
        </div>
      </section>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold tracking-tight">{t("Миний зарууд")}</h2>
        <Link href="/sell" className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-hover">
          <Plus className="size-4" strokeWidth={2.6} />
          {t("Зар нэмэх")}
        </Link>
      </div>
      <div className="mt-4 space-y-3">
        {cars.loading && !cars.data ? (
          <LoadingState />
        ) : cars.error ? (
          <ErrorState message={cars.error.message} onRetry={cars.reload} />
        ) : visible.length ? (
          visible.map((car) => <MyCarRow key={car.id} car={car} onChange={cars.reload} />)
        ) : (
          <EmptyState title={t("Танд зар алга")} description={t("Машинаа зарах бол анхны зараа нэмээрэй.")} />
        )}
      </div>
    </Container>
  );
}

export default function ProfilePage() {
  return (
    <RequireAuth>
      <Profile />
    </RequireAuth>
  );
}
