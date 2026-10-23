"use client";

import { carTitle } from "@/components/car/CarCard";
import CarImage from "@/components/car/CarImage";
import Container, { PageTitle } from "@/components/common/Container";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import { getCarsByIds } from "@/lib/api/cars";
import { ApiError } from "@/lib/api/client";
import { getMyMessages } from "@/lib/api/messages";
import { useAuth } from "@/lib/auth/AuthProvider";
import { openChat } from "@/lib/chat";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useApi } from "@/lib/useApi";
import { cn, timeAgo } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** The signed-in visitor's questions about ads, with the ad and whether the team has handled it. */
export default function MessagesPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { user, token, ready, signOut } = useAuth();

  useEffect(() => {
    if (ready && !user) router.replace("/login?next=/messages");
  }, [ready, user, router]);

  const list = useApi(async () => {
    if (!token) return undefined;
    const rows = await getMyMessages(token);
    const ids = [...new Set(rows.map((m) => m.car_id).filter((id): id is number => !!id))];
    const cars = new Map((await getCarsByIds(ids)).map((c) => [c.id, c]));
    return rows.map((m) => ({ ...m, car: m.car_id ? cars.get(m.car_id) : undefined }));
  }, token ?? "");

  // Expired session: back to the code sign-in.
  useEffect(() => {
    if (list.error instanceof ApiError && list.error.status === 401) signOut();
  }, [list.error, signOut]);

  if (!ready || !user) return <LoadingState className="min-h-[50vh]" />;

  return (
    <Container className="max-w-2xl pt-4 md:pt-12">
      <PageTitle count={list.data?.length}>{t("Мессеж")}</PageTitle>
      <div className="md:mt-8">
        {list.loading && !list.data ? (
          <LoadingState />
        ) : list.error ? (
          <ErrorState message={list.error.message} onRetry={list.reload} />
        ) : !list.data?.length ? (
          <EmptyState
            title={t("Мессеж алга")}
            description={t("Зар дээрх чат товчоор асуултаа илгээгээрэй.")}
            action={<Link href="/cars" className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white">{t("Машин хайх")}</Link>}
          />
        ) : (
          <ul className="space-y-3">
            {list.data.map((m) => {
              const done = m.status === "done";
              const title = m.car ? `${carTitle(m.car, t)} ${m.car.manufactured_year ?? ""}`.trim() : null;
              return (
                <li key={m.id} className="rounded-2xl bg-card p-4">
                  {m.car && title && (
                    <Link href={`/cars/${m.car.id}`} className="mb-3 flex items-center gap-3 border-b border-border pb-3">
                      <CarImage id={m.car.id} image={m.car.image} bodyType={m.car.body_type_name} size="thumb" className="h-11 w-14 shrink-0 rounded-lg" artClassName="w-9" />
                      <span className="min-w-0 flex-1 truncate text-sm font-bold">{title}</span>
                    </Link>
                  )}
                  <p className="whitespace-pre-line text-[15px] leading-6">{m.message}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[11px] font-bold",
                        done ? "bg-success-soft text-success" : "bg-amber-soft text-amber-ink"
                      )}
                    >
                      {done ? t("Холбогдсон") : t("Хүлээгдэж байна")}
                    </span>
                    <span className="text-xs text-muted-foreground">{timeAgo(m.created_at, t)}</span>
                    {m.car && title && (
                      <button
                        type="button"
                        onClick={() => openChat({ carId: m.car!.id, title })}
                        className="ml-auto text-sm font-semibold text-primary"
                      >
                        {t("Дахин бичих")}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Container>
  );
}
