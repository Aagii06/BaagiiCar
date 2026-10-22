"use client";

import Container, { PageTitle } from "@/components/common/Container";
import Img from "@/components/common/Img";
import { EmptyState, ErrorState } from "@/components/common/States";
import { uploadUrl } from "@/lib/api/config";
import { getDealers, type Dealer } from "@/lib/api/dealers";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useApi } from "@/lib/useApi";
import { Phone, Store } from "lucide-react";

function DealerCard({ dealer }: { dealer: Dealer }) {
  const { t } = useI18n();
  const name = [dealer.firstname, dealer.lastname].filter(Boolean).join(" ") || t("Дилер");
  const logo = uploadUrl(dealer.logo, "full", "users");
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-white p-4">
      <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-muted">
        {logo ? <Img src={logo} alt={name} className="size-full object-contain" /> : <Store className="size-7 text-muted-foreground" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold">{name}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{t("{n} зар", { n: dealer.car_count })}</p>
        {dealer.phonenumber && (
          <a href={`tel:${dealer.phonenumber}`} className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
            <Phone className="size-3.5" />
            {dealer.phonenumber}
          </a>
        )}
      </div>
    </div>
  );
}

/** Registered dealers, most listings first. */
export default function DealersPage() {
  const { t } = useI18n();
  const dealers = useApi(getDealers);
  const rows = dealers.data?.rows ?? [];

  return (
    <Container className="pt-8 md:pt-12">
      <PageTitle count={dealers.loading ? undefined : rows.length}>{t("Дилерүүд")}</PageTitle>
      <div className="mt-8">
        {dealers.loading && !dealers.data ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : dealers.error ? (
          <ErrorState message={dealers.error.message} onRetry={dealers.reload} />
        ) : rows.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((dealer) => (
              <DealerCard key={dealer.id} dealer={dealer} />
            ))}
          </div>
        ) : (
          <EmptyState title={t("Бүртгэлтэй дилер алга")} />
        )}
      </div>
    </Container>
  );
}
