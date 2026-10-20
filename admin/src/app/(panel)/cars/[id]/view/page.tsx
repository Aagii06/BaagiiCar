"use client";

import CarImage from "@/components/car/CarImage";
import PhotoViewer from "@/components/common/PhotoViewer";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import { errorMessage, useToast } from "@/components/common/Toast";
import { DetailHeader } from "@/components/layout/PageHeader";
import { approveCar, getCar, getCarFiles } from "@/lib/api/admin";
import type { Car } from "@/lib/api/types";
import { uploadUrl, WEB_URL } from "@/lib/api/config";
import { useAuth } from "@/lib/auth/AuthProvider";
import { bodyTypeLabel, CAR_STATUS, ROLES } from "@/lib/constants";
import { useApi } from "@/lib/useApi";
import { cn, formatEngine, formatNumber, formatPrice, timeAgo } from "@/lib/utils";
import { Check, ExternalLink, Eye, Heart, Pencil, Phone } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

/**
 * Read-only preview of an ad laid out like the web detail page. The web only
 * serves active/sold ads, so this is where pending ones can be checked.
 */
export default function CarViewPage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const data = useApi(async () => {
    const car = await getCar(id);
    if (!car) return null;
    const files = await getCarFiles(car.id);
    return { car, photos: files.map((f) => f.generated_name).filter((n): n is string => Boolean(n)) };
  }, id);

  const approve = async (car: Car) => {
    setBusy(true);
    try {
      await approveCar(car.id);
      toast("Баталлаа, вэб дээр нийтлэгдлээ");
      data.reload();
    } catch (err) {
      toast(errorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  };

  const car = data.data?.car;

  return (
    <>
      <DetailHeader
        title={car ? `#${car.id} ${car.name ?? ""}` : "Зар"}
        back="/cars"
        aside={
          car && car.status !== "deleted" ? (
            <Link href={`/cars/${car.id}`} aria-label="Засах" className="grid size-10 place-items-center rounded-xl hover:bg-muted">
              <Pencil className="size-4" />
            </Link>
          ) : null
        }
      />
      {data.loading && !data.data ? (
        <LoadingState />
      ) : data.error ? (
        <ErrorState message={data.error.message} onRetry={data.reload} />
      ) : !car ? (
        <EmptyState title="Зар олдсонгүй" />
      ) : (
        // Full-width like the web detail page: photos + specs left, price / seller right on desktop.
        <div className={cn("mx-auto max-w-[1280px] md:px-6", busy && "pointer-events-none opacity-60")}>
          <StatusBanner car={car} onApprove={() => approve(car)} />

          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_380px] lg:items-start lg:gap-6">
            <div className="min-w-0 lg:col-start-1">
              <Gallery car={car} photos={data.data!.photos} />
            </div>

            <aside className="space-y-4 lg:sticky lg:top-20 lg:col-start-2 lg:row-span-2 lg:row-start-1">
              <section className="rounded-2xl bg-card p-4 md:p-5">
                <h1 className="font-display text-xl font-bold leading-tight md:text-2xl">{car.name}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{[car.manufactured_year, car.location_name].filter(Boolean).join(" · ")}</p>
                <p className="mt-3 font-display text-2xl font-bold text-primary md:text-3xl">{formatPrice(car.price)}</p>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="size-3.5" />
                    {car.view_count ?? 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="size-3.5" />
                    {car.favorite_count ?? 0}
                  </span>
                  {car.created_at && <span>{timeAgo(car.created_at)}</span>}
                </div>
              </section>

              <section className="flex items-center gap-3 rounded-2xl bg-card p-4 md:p-5">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-muted-foreground">Зарын эзэн</p>
                  <p className="truncate font-bold">{car.seller_name || "—"}</p>
                </div>
                {(car.phonenumber || car.seller_phone) && (
                  <a href={`tel:${car.phonenumber || car.seller_phone}`} className="flex items-center gap-1.5 rounded-xl bg-dark px-3 py-2 text-sm font-bold text-white">
                    <Phone className="size-4" />
                    {car.phonenumber || car.seller_phone}
                  </a>
                )}
              </section>
            </aside>

            <div className="min-w-0 space-y-4 lg:col-start-1">
              <Specs car={car} />
              {car.description && (
                <section className="rounded-2xl bg-card p-4 md:p-5">
                  <h2 className="font-bold">Тайлбар</h2>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{car.description}</p>
                </section>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function StatusBanner({ car, onApprove }: { car: Car; onApprove: () => void }) {
  const isAdmin = useAuth().user?.role === ROLES.admin;
  const st = CAR_STATUS[car.status] ?? CAR_STATUS.active;
  const onWeb = car.status === "active" || car.status === "sold";
  return (
    <div className={cn("flex items-center gap-3 rounded-2xl p-3.5", car.status === "pending" ? "bg-amber-soft text-amber-ink" : "bg-card")}>
      <div className="min-w-0 flex-1">
        <span className={cn("inline-block rounded-full px-2 py-0.5 text-[10px] font-bold", st.className)}>{st.label}</span>
        <p className="mt-1 text-xs font-medium">{onWeb ? "Вэб сайт дээр нийтлэгдсэн" : car.status === "pending" ? "Батлагдаагүй тул вэб дээр харагдахгүй" : "Вэб дээр харагдахгүй"}</p>
      </div>
      {car.status === "pending" && isAdmin && (
        <button onClick={onApprove} className="flex shrink-0 items-center gap-1 rounded-xl bg-success px-3 py-2 text-sm font-bold text-white">
          <Check className="size-4" strokeWidth={3} />
          Батлах
        </button>
      )}
      {onWeb && WEB_URL && (
        <a href={`${WEB_URL}/cars/${car.id}`} target="_blank" rel="noreferrer" className="flex shrink-0 items-center gap-1 rounded-xl bg-muted px-3 py-2 text-sm font-bold">
          Вэб
          <ExternalLink className="size-3.5" />
        </a>
      )}
    </div>
  );
}

function Gallery({ car, photos }: { car: Car; photos: string[] }) {
  const [index, setIndex] = useState(0);
  const [viewing, setViewing] = useState<number | null>(null);

  if (!photos.length) return <CarImage id={car.id} image={null} bodyType={car.body_type_name} className="aspect-[4/3] rounded-2xl md:aspect-auto md:h-[360px]" />;

  const counter = (
    <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-dark/80 px-2.5 py-1 text-xs font-bold text-white">
      {index + 1} / {photos.length}
    </span>
  );

  return (
    <section>
      {/* Mobile: swipe between photos, dots show how many there are. */}
      <div className="md:hidden">
        <div className="relative">
          <div
            onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
            className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto rounded-2xl bg-muted"
          >
            {photos.map((name, i) => (
              <button key={name} type="button" onClick={() => setViewing(i)} aria-label="Зураг томоор харах" className="aspect-[4/3] w-full shrink-0 snap-center">
                {/* eslint-disable-next-line @next/next/no-img-element -- backend-served uploads */}
                <img src={uploadUrl(name, "grid")!} alt="" loading={i ? "lazy" : undefined} className="size-full object-cover" />
              </button>
            ))}
          </div>
          {counter}
        </div>
        {photos.length > 1 && (
          <div className="mt-2.5 flex justify-center gap-1.5">
            {photos.map((name, i) => (
              <span key={name} className={cn("h-1.5 rounded-full transition-all", i === index ? "w-5 bg-foreground" : "w-1.5 bg-foreground/25")} />
            ))}
          </div>
        )}
      </div>

      {/* Desktop: smaller main photo with a thumbnail column beside it. */}
      <div className="hidden h-[360px] gap-2 md:flex">
        <button type="button" onClick={() => setViewing(index)} aria-label="Зураг томоор харах" className="relative min-w-0 flex-1 overflow-hidden rounded-2xl bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element -- backend-served uploads */}
          <img src={uploadUrl(photos[index], "grid")!} alt="" className="size-full object-cover" />
          {counter}
        </button>
        {photos.length > 1 && (
          <div className="no-scrollbar flex w-28 shrink-0 flex-col gap-2 overflow-y-auto">
            {photos.map((name, i) => (
              <button
                key={name}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`${i + 1}-р зураг`}
                className={cn("aspect-[4/3] w-full shrink-0 overflow-hidden rounded-lg border-2", i === index ? "border-foreground" : "border-transparent opacity-80 hover:opacity-100")}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- backend-served uploads */}
                <img src={uploadUrl(name, "thumb")!} alt="" className="size-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {viewing !== null && <PhotoViewer urls={photos.map((n) => uploadUrl(n, "full")!)} start={viewing} onClose={() => setViewing(null)} />}
    </section>
  );
}

function Specs({ car }: { car: Car }) {
  const specs: [string, string | number | null | undefined][] = [
    ["Үйлдвэрлэсэн он", car.manufactured_year],
    ["Орж ирсэн он", car.imported_year],
    ["Гүйлт", car.mileage != null ? `${formatNumber(car.mileage)} км` : null],
    ["Хөдөлгүүр", car.engine_capacity ? formatEngine(car.engine_capacity) : null],
    ["Түлш", car.fuel_type],
    ["Хурдны хайрцаг", car.transmission],
    ["Хүрд", car.steering],
    ["Хөтлөгч", car.drive_type],
    ["Өнгө", car.color],
    ["Төрөл", bodyTypeLabel(car.body_type_name)],
    ["VIN", car.vin],
  ];
  return (
    <section className="rounded-2xl bg-card p-4 md:p-5">
      <h2 className="font-bold">Үзүүлэлт</h2>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
        {specs.map(([label, value]) => (
          <div key={label} className="rounded-xl bg-muted px-3 py-2.5">
            <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
            <p className="mt-0.5 truncate text-sm font-bold">{value || "—"}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
