"use client";

import { carTitle } from "@/components/car/CarCard";
import CarImage from "@/components/car/CarImage";
import Container from "@/components/common/Container";
import { LoadingState } from "@/components/common/States";
import { getCar } from "@/lib/api/cars";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useApi } from "@/lib/useApi";
import { formatPrice, initials } from "@/lib/utils";
import { MessageCircle, Phone, Search } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

/**
 * Chat layout from the design. The backend has no messaging API yet, so
 * the thread pane offers the seller's phone instead of a message box.
 */
function ChatInner() {
  const { t } = useI18n();
  const carId = useSearchParams().get("car");
  const car = useApi(() => (carId ? getCar(carId) : Promise.resolve(null)), carId ?? "");
  const c = car.data;
  const phone = c?.phonenumber || c?.seller_phone;

  return (
    <Container className="pt-6">
      <div className="grid min-h-[560px] overflow-hidden rounded-3xl bg-card md:grid-cols-[340px_1fr]">
        <aside className="border-b border-border md:border-b-0 md:border-r">
          <div className="p-5">
            <h1 className="font-display text-2xl font-bold tracking-tight">{t("Чат")}</h1>
            <label className="mt-4 flex items-center gap-2 rounded-xl bg-muted px-3.5 py-3">
              <Search className="size-4 text-muted-foreground" />
              <input placeholder={t("Хайх")} disabled className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
            </label>
          </div>
          <div className="border-t border-border p-2">
            {c ? (
              <div className="flex items-center gap-3 rounded-xl bg-muted p-3">
                <CarImage id={c.id} image={c.image} bodyType={c.body_type_name} size="icon" className="size-12 shrink-0" artClassName="w-[80%]" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{carTitle(c, t)}</p>
                  <p className="truncate text-xs text-muted-foreground">{c.seller_name || t("Зарлагч")}</p>
                </div>
              </div>
            ) : (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">{t("Яриа алга")}</p>
            )}
          </div>
        </aside>

        <section className="flex flex-col">
          {car.loading && carId ? (
            <LoadingState className="flex-1" />
          ) : c ? (
            <>
              <header className="flex items-center gap-3 border-b border-border px-5 py-4">
                <span className="grid size-11 place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary">{initials(c.seller_name)}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{c.seller_name || t("Зарлагч")}</p>
                </div>
                <Link href={`/cars/${c.id}`} className="hidden items-center gap-3 rounded-xl bg-muted px-3 py-2 sm:flex">
                  <span className="text-right">
                    <span className="block text-xs font-bold">{carTitle(c, t)}</span>
                    <span className="block text-xs font-bold text-primary">{formatPrice(c.price, t)}</span>
                  </span>
                </Link>
              </header>
              <div className="grid flex-1 place-items-center bg-background/50 p-8 text-center">
                <div className="max-w-sm">
                  <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary">
                    <MessageCircle className="size-6" />
                  </span>
                  <p className="mt-4 font-bold">{t("Чат удахгүй нээгдэнэ")}</p>
                  <p className="mt-1.5 text-sm text-muted-foreground">{t("Одоогоор зарлагчтай утсаар шууд холбогдоно уу.")}</p>
                  {phone && (
                    <a href={`tel:${phone}`} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-primary-hover">
                      <Phone className="size-4" />
                      {phone}
                    </a>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="grid flex-1 place-items-center p-8 text-center">
              <div className="max-w-sm">
                <p className="font-bold">{t("Чат удахгүй нээгдэнэ")}</p>
                <p className="mt-1.5 text-sm text-muted-foreground">{t("Зарын хуудаснаас зарлагчтай утсаар холбогдох боломжтой.")}</p>
                <Link href="/cars" className="mt-5 inline-block rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white">
                  {t("Машин хайх")}
                </Link>
              </div>
            </div>
          )}
        </section>
      </div>
    </Container>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ChatInner />
    </Suspense>
  );
}
