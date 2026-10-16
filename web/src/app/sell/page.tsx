"use client";

import CarForm from "@/components/car/CarForm";
import Container, { PageTitle } from "@/components/common/Container";
import RequireAuth from "@/components/common/RequireAuth";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import { getCar, getCarFiles, type PhotoItem } from "@/lib/api/cars";
import { uploadUrl } from "@/lib/api/config";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useApi } from "@/lib/useApi";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function EditLoader({ id }: { id: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const data = useApi(async () => {
    const car = await getCar(id);
    if (!car) return null;
    const files = await getCarFiles(car.id);
    const photos: PhotoItem[] = files
      .filter((f) => f.generated_name)
      .map((f) => ({ kind: "existing", id: f.id, url: uploadUrl(f.generated_name, "grid")! }));
    return { car, photos };
  }, id);

  if (data.loading && !data.data) return <LoadingState />;
  if (data.error) return <ErrorState message={data.error.message} onRetry={data.reload} />;
  if (!data.data || data.data.car.status === "deleted") return <EmptyState title="Зар олдсонгүй" />;
  if (user && data.data.car.user_id !== user.id && user.role !== "Админ")
    return <EmptyState title="Зөвхөн өөрийн зарыг засах боломжтой" />;
  return <CarForm car={data.data.car} photos={data.data.photos} onSaved={(carId) => router.push(`/cars/${carId}`)} />;
}

function SellInner() {
  const router = useRouter();
  const { user } = useAuth();
  const id = useSearchParams().get("id");
  return (
    <Container className="max-w-[960px] pt-8 md:pt-12">
      <PageTitle>{id ? "Зар засах" : "Зар нэмэх"}</PageTitle>
      <p className="mb-6 mt-3 text-sm text-muted-foreground">Зураг, мэдээллээ оруулаад нийтлэхэд зар тань шууд гарна.</p>
      {id ? <EditLoader id={id} /> : <CarForm defaultPhone={user?.phonenumber} onSaved={(carId) => router.push(`/cars/${carId}`)} />}
    </Container>
  );
}

export default function SellPage() {
  return (
    <RequireAuth>
      <Suspense fallback={<LoadingState />}>
        <SellInner />
      </Suspense>
    </RequireAuth>
  );
}
