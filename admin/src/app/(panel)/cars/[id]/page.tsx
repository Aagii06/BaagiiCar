"use client";

import CarForm from "@/components/car/CarForm";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import { useToast } from "@/components/common/Toast";
import { DetailHeader } from "@/components/layout/PageHeader";
import { getCar, getCarFiles, type PhotoItem } from "@/lib/api/admin";
import { uploadUrl } from "@/lib/api/config";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useApi } from "@/lib/useApi";
import { Eye } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

/** `/cars/new` creates an ad under the admin's own account; `/cars/:id` edits any ad. */
export default function CarEditPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === "new";
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();

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

  const title = isNew ? "Шинэ зар" : data.data?.car ? `#${data.data.car.id} ${data.data.car.name ?? ""}` : "Зар";

  return (
    <>
      <DetailHeader
        title={title}
        back="/cars"
        aside={
          !isNew ? (
            // Preview works for pending ads too, unlike the public site.
            <Link href={`/cars/${id}/view`} aria-label="Зарыг харах" className="grid size-10 place-items-center rounded-xl hover:bg-muted">
              <Eye className="size-4" />
            </Link>
          ) : null
        }
      />
      {data.loading && !data.data ? (
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
          onSaved={() => {
            toast("Хадгаллаа");
            router.push("/cars");
          }}
        />
      )}
    </>
  );
}
