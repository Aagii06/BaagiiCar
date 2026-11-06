"use client";

import DealerForm, { DEALER_FORM_ID } from "@/components/dealer/DealerForm";
import { EmptyState, ErrorState, FormSkeleton } from "@/components/common/States";
import { DetailHeader } from "@/components/layout/PageHeader";
import { getDealer } from "@/lib/api/admin";
import { useApi } from "@/lib/useApi";
import { useBackTo, withFrom } from "@/lib/useBackTo";
import { useRouteId } from "@/lib/useRouteId";
import { Loader2, Save } from "lucide-react";
import { Suspense, useState } from "react";
import { tr } from "@/lib/i18n/translations";

export default function DealerPage() {
  return (
    <Suspense fallback={<FormSkeleton sections={[7]} />}>
      <DealerDetail />
    </Suspense>
  );
}

function DealerDetail() {
  const listHref = withFrom("/dealers", useBackTo("/dealers").from);
  const id = useRouteId();
  const isNew = id === "new";
  const data = useApi(() => (isNew ? Promise.resolve(null) : getDealer(id)), id);
  const [saving, setSaving] = useState(false);
  const formShown = isNew || (data.data && data.data.status !== "deleted");
  const saveLabel = isNew ? tr("Бүртгэх") : tr("Хадгалах");

  return (
    <>
      <DetailHeader
        title={isNew ? tr("Шинэ дилер") : (data.data?.name ?? tr("Дилер"))}
        back={listHref}
        aside={
          formShown && (
            <button
              type="submit"
              form={DEALER_FORM_ID}
              disabled={saving}
              aria-label={saveLabel}
              title={saveLabel}
              className="grid size-10 place-items-center rounded-xl bg-primary text-white hover:bg-primary-hover disabled:opacity-60"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            </button>
          )
        }
      />
      {isNew ? (
        <DealerForm dealer={null} listHref={listHref} onBusyChange={setSaving} />
      ) : data.loading && !data.data ? (
        <FormSkeleton sections={[7]} />
      ) : data.error ? (
        <ErrorState message={data.error.message} onRetry={data.reload} />
      ) : !data.data || data.data.status === "deleted" ? (
        <EmptyState title={tr("Дилер олдсонгүй")} />
      ) : (
        <DealerForm key={data.data.id} dealer={data.data} listHref={listHref} onBusyChange={setSaving} />
      )}
    </>
  );
}
