"use client";

import CarForm, { CAR_FORM_ID } from "@/components/car/CarForm";
import DealerPicker from "@/components/car/DealerPicker";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import { useToast } from "@/components/common/Toast";
import { DetailHeader } from "@/components/layout/PageHeader";
import { getCar, getCarFiles, getDealers, type PhotoItem } from "@/lib/api/admin";
import type { Dealer } from "@/lib/api/types";
import { uploadUrl } from "@/lib/api/config";
import { useAuth } from "@/lib/auth/AuthProvider";
import { ROLES } from "@/lib/constants";
import { useApi } from "@/lib/useApi";
import { Check, Eye } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRouteId } from "@/lib/useRouteId";
import { useState } from "react";

/**
 * `/cars/new`: an admin first picks the dealer; a dealer's own dealer is used as is.
 * `/cars/:id` edits an ad (dealers only reach their own dealer's ads).
 */
export default function CarEditPage() {
  const id = useRouteId();
  const isNew = id === "new";
  const router = useRouter();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.admin;
  /** Admin's pick; `undefined` = not picked yet. */
  const [picked, setPicked] = useState<Dealer | undefined>(undefined);
  // A dealer posts for their own dealer: no picker.
  const dealers = useApi(() => (isNew && !isAdmin ? getDealers() : Promise.resolve([] as Dealer[])), `${isNew}|${isAdmin}`);
  const ownDealer = isAdmin ? undefined : dealers.data?.find((d) => d.id === user?.dealer_id);
  const dealer = isAdmin ? picked : ownDealer;
  const picking = isNew && isAdmin && !picked;
  const waitingOwnDealer = isNew && !isAdmin && dealers.loading && !dealers.data;
  const noOwnDealer = isNew && !isAdmin && !!dealers.data && !ownDealer;

  const data = useApi(async () => {
    if (isNew) return { car: null, photos: [] as PhotoItem[] };
    const car = await getCar(id);
    if (!car) return null;
    const files = await getCarFiles(car.id);
    const photos: PhotoItem[] = files
      .filter((f) => f.generated_name)
      .map((f) => ({ kind: "existing", id: f.id, url: uploadUrl(f.generated_name, "grid")! }));
    return { car, photos };
  }, id);

  const title = picking ? "Шинэ зар · дилер сонгох" : isNew ? (dealer ? `Шинэ зар · ${dealer.name}` : "Шинэ зар") : data.data?.car ? `#${data.data.car.code ?? data.data.car.id} ${data.data.car.name ?? ""}` : "Зар";

  return (
    <>
      <DetailHeader
        title={title}
        back="/cars"
        aside={
          <div className="flex items-center gap-1">
            {!isNew && (
              // Preview works for pending ads too, unlike the public site.
              <Link href={`/cars/${id}/view`} aria-label="Зарыг харах" className="grid size-10 place-items-center rounded-xl hover:bg-muted">
                <Eye className="size-4" />
              </Link>
            )}
            {/* Same as the save button at the bottom of the form. */}
            {!picking && !noOwnDealer && data.data && data.data.car?.status !== "deleted" && (
              <button type="submit" form={CAR_FORM_ID} disabled={saving} className="flex h-9 items-center gap-1 rounded-xl bg-primary px-3 text-sm font-bold text-white hover:bg-primary-hover disabled:opacity-60">
                <Check className="size-4" strokeWidth={3} />
                {saving ? "Хадгалж байна…" : isNew ? (isAdmin ? "Нийтлэх" : "Илгээх") : "Хадгалах"}
              </button>
            )}
          </div>
        }
      />
      {picking ? (
        <DealerPicker onPick={setPicked} />
      ) : waitingOwnDealer ? (
        <LoadingState />
      ) : noOwnDealer ? (
        <EmptyState title="Таны бүртгэл дилерт харьяалагдаагүй байна" description="Зар нэмэхийн тулд админд хандаж дилерт харьяалуулна уу." />
      ) : data.loading && !data.data ? (
        <LoadingState />
      ) : data.error ? (
        <ErrorState message={data.error.message} onRetry={data.reload} />
      ) : !data.data || data.data.car?.status === "deleted" ? (
        <EmptyState title="Зар олдсонгүй эсвэл устгагдсан" />
      ) : (
        <CarForm
          key={id}
          car={data.data.car}
          photos={data.data.photos}
          defaultPhone={user?.phonenumber}
          dealer={dealer ?? undefined}
          onBusyChange={setSaving}
          onSaved={() => {
            toast("Хадгаллаа");
            router.push("/cars");
          }}
        />
      )}
    </>
  );
}
