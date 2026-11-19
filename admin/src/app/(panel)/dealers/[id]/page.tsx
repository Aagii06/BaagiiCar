"use client";

import DealerForm, { DEALER_FORM_ID } from "@/components/dealer/DealerForm";
import DealerView from "@/components/dealer/DealerView";
import DealerWalletSection from "@/components/dealer/DealerWalletSection";
import { EmptyState, ErrorState, FormSkeleton } from "@/components/common/States";
import { DetailHeader } from "@/components/layout/PageHeader";
import { getDealer } from "@/lib/api/admin";
import { useApi } from "@/lib/useApi";
import { useBackTo, withFrom } from "@/lib/useBackTo";
import { useRouteId } from "@/lib/useRouteId";
import { Loader2, Pencil, Save } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
  const { from } = useBackTo("/dealers");
  const listHref = withFrom("/dealers", from);
  const id = useRouteId();
  const isNew = id === "new";
  // An existing dealer opens read-only; the header's pencil switches to `?edit=1`.
  const editParam = useSearchParams().get("edit") === "1";
  const editing = isNew || editParam;
  const viewHref = withFrom(`/dealers/${id}`, from);
  const editHref = `/dealers/${id}?edit=1${from ? `&from=${from}` : ""}`;
  const data = useApi(() => (isNew ? Promise.resolve(null) : getDealer(id)), `${id}:${editing}`); // refetched on view ↔ edit, so a save shows up
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const formShown = isNew || (data.data && data.data.status !== "deleted");
  const saveLabel = isNew ? tr("Бүртгэх") : tr("Хадгалах");

  return (
    <>
      <DetailHeader
        title={isNew ? tr("Шинэ дилер") : (data.data?.name ?? tr("Дилер"))}
        back={isNew || !editing ? listHref : viewHref}
        aside={
          formShown &&
          (!editing ? (
            <Link href={editHref} aria-label={tr("Засах")} title={tr("Засах")} className="grid size-10 place-items-center rounded-xl bg-primary text-white hover:bg-primary-hover">
              <Pencil className="size-4" />
            </Link>
          ) : (
            <button
              type="submit"
              form={DEALER_FORM_ID}
              disabled={saving || !dirty}
              aria-label={saveLabel}
              title={saveLabel}
              className="grid size-10 place-items-center rounded-xl bg-primary text-white hover:bg-primary-hover disabled:opacity-60"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            </button>
          ))
        }
      />
      {isNew ? (
        <DealerForm dealer={null} listHref={listHref} onBusyChange={setSaving} onDirtyChange={setDirty} />
      ) : data.loading && !data.data ? (
        <FormSkeleton sections={[7]} />
      ) : data.error ? (
        <ErrorState message={data.error.message} onRetry={data.reload} />
      ) : !data.data || data.data.status === "deleted" ? (
        <EmptyState title={tr("Дилер олдсонгүй")} />
      ) : editing ? (
        <DealerForm key={data.data.id} dealer={data.data} listHref={listHref} savedHref={viewHref} onBusyChange={setSaving} onDirtyChange={setDirty} />
      ) : (
        <>
          <DealerView key={data.data.id} dealer={data.data} onChanged={data.reload} />
          <DealerWalletSection dealerId={data.data.id} dealerName={data.data.name} />
        </>
      )}
    </>
  );
}
