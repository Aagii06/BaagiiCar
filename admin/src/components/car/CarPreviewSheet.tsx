"use client";

import CarImage from "@/components/car/CarImage";
import PhotoViewer from "@/components/common/PhotoViewer";
import { Spinner } from "@/components/common/States";
import { getCarFiles } from "@/lib/api/admin";
import { uploadUrl } from "@/lib/api/config";
import type { Car } from "@/lib/api/types";
import { CAR_STATUS } from "@/lib/constants";
import { useApi } from "@/lib/useApi";
import { withFrom, type CarOrigin } from "@/lib/useBackTo";
import { carTitle, cn, formatPrice } from "@/lib/utils";
import { ArrowRight, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { carSpecs } from "./carSpecs";

/** Quick look at an ad (photos, price, specs) without leaving the page; "Дэлгэрэнгүй" opens the full preview. */
export default function CarPreviewSheet({ car, from, onClose }: { car: Car; from: CarOrigin; onClose: () => void }) {
  const files = useApi(() => getCarFiles(car.id), String(car.id));
  const photos = (files.data ?? []).map((f) => f.generated_name).filter((n): n is string => Boolean(n));
  const [viewing, setViewing] = useState<number | null>(null);
  const status = CAR_STATUS[car.status] ?? CAR_STATUS.active;

  // Esc closes the sheet (the photo viewer handles its own Esc while open); the page behind stays put.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && viewing === null && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewing, onClose]);
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 animate-fade-in bg-dark/50 backdrop-blur-[2px]" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="car-preview-title"
        className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[88vh] max-w-md animate-sheet-up flex-col rounded-t-3xl bg-white shadow-2xl"
      >
        <div className="flex items-start gap-3 px-5 pb-3 pt-3">
          <div className="min-w-0 flex-1">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border" />
            <h2 id="car-preview-title" className="truncate text-lg font-bold">
              {carTitle(car)}
            </h2>
            <div className="mt-0.5 flex items-center gap-2">
              <span className="font-display text-xl font-bold text-primary">{formatPrice(car.price)}</span>
              <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", status.className)}>{status.label}</span>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Хаах" className="mt-4 grid size-9 shrink-0 place-items-center rounded-full bg-muted hover:bg-border">
            <X className="size-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 pb-4">
          {files.loading && !files.data ? (
            <div className="grid aspect-[4/3] place-items-center rounded-2xl bg-muted">
              <Spinner className="size-5" />
            </div>
          ) : photos.length ? (
            <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-2 overflow-x-auto px-5">
              {photos.map((name, i) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setViewing(i)}
                  aria-label={`${i + 1}-р зураг томоор харах`}
                  className={cn("aspect-[4/3] shrink-0 snap-center overflow-hidden rounded-2xl bg-muted", photos.length > 1 ? "w-[85%]" : "w-full")}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- backend-served uploads */}
                  <img src={uploadUrl(name, "grid")!} alt="" className="size-full object-cover" />
                </button>
              ))}
            </div>
          ) : (
            <CarImage id={car.id} image={null} bodyType={car.body_type_name} className="aspect-[4/3] w-full rounded-2xl" />
          )}

          <div className="grid grid-cols-2 gap-2">
            {carSpecs(car).map(([label, value]) => (
              <div key={label} className="rounded-xl bg-muted px-3 py-2">
                <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
                <p className="mt-0.5 truncate text-sm font-bold">{value || "—"}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-border px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <Link
            href={withFrom(`/cars/${car.id}/view`, from)}
            className="flex h-12 w-full items-center justify-center gap-1.5 rounded-xl bg-primary font-bold text-white hover:bg-primary-hover"
          >
            Дэлгэрэнгүй
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>

      {viewing !== null && <PhotoViewer urls={photos.map((n) => uploadUrl(n, "full")!)} start={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}
