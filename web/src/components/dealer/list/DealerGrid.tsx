"use client";

import { EmptyState, ErrorState } from "@/components/common/States";
import { DEALER_STEP } from "@/components/dealer/constants";
import DealerCard from "@/components/dealer/list/DealerCard";
import type { Dealer } from "@/lib/api/dealers";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useState } from "react";

/** Dealer cards, DEALER_STEP at a time, with loading / error / empty states. */
export default function DealerGrid({
  rows,
  loading,
  error,
  onRetry,
}: {
  rows: Dealer[] | undefined;
  loading: boolean;
  error: Error | null | undefined;
  onRetry: () => void;
}) {
  const { t } = useI18n();
  const [shown, setShown] = useState(DEALER_STEP);

  if (loading && !rows)
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: DEALER_STEP }, (_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    );
  if (error) return <ErrorState message={error.message} onRetry={onRetry} />;
  if (!rows?.length) return <EmptyState title={t("Бүртгэлтэй дилер алга")} />;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.slice(0, shown).map((dealer) => (
          <DealerCard key={dealer.id} dealer={dealer} />
        ))}
      </div>
      {shown < rows.length && (
        <button
          type="button"
          onClick={() => setShown((n) => n + DEALER_STEP)}
          className="mx-auto mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-card text-sm font-bold hover:bg-border sm:w-64 md:mt-8"
        >
          {t("Цааш үзэх")}
          <span className="font-medium text-muted-foreground">
            {shown} / {rows.length}
          </span>
        </button>
      )}
    </>
  );
}
