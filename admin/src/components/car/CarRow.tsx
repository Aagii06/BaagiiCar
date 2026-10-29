"use client";

import CarImage from "@/components/car/CarImage";
import { useRejectCar } from "@/components/car/useRejectCar";
import Img from "@/components/common/Img";
import type { ChipTab } from "@/components/common/ChipTabs";
import { useConfirm, type ConfirmOptions } from "@/components/common/Confirm";
import { errorMessage, useToast } from "@/components/common/Toast";
import { approveCar, deleteCar, markSold, setFeatured, setHidden, type CarStatusFilter } from "@/lib/api/admin";
import { catalogImage } from "@/lib/api/config";
import type { Car } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/AuthProvider";
import { CAR_STATUS, ROLES } from "@/lib/constants";
import { carTitle, cn, formatPrice, initials } from "@/lib/utils";
import { BadgeCheck, Check, Eye, EyeOff, Phone, Star, Store, Trash2, Undo2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export const PAGE_SIZE = 20;
export type Tab = CarStatusFilter | "all";
// Each status in its own colour: soft while off, solid once picked.
export const TABS: ChipTab<Tab>[] = [
  { value: "all", label: "Бүгд" },
  { value: "pending", label: "Хүлээгдэж буй", tone: { on: "bg-amber text-dark", off: "bg-amber-soft text-amber-ink" } },
  { value: "rejected", label: "Буцаасан", tone: { on: "bg-destructive text-white", off: "bg-destructive-soft text-destructive" } },
  { value: "active", label: "Идэвхтэй", tone: { on: "bg-success text-white", off: "bg-success-soft text-success" } },
  { value: "featured", label: "Онцлох", tone: { on: "bg-primary text-white", off: "bg-primary-soft text-primary" } },
  { value: "hidden", label: "Нуусан", tone: { on: "bg-slate-500 text-white", off: "bg-slate-100 text-slate-600" } },
  { value: "sold", label: "Зарагдсан", tone: { on: "bg-sky-600 text-white", off: "bg-tint-blue text-sky-700" } },
  { value: "deleted", label: "Устгасан", tone: { on: "bg-rose-800 text-white", off: "bg-tint-rose text-rose-800" } },
];

/** One ad in an admin list, with its status actions. */
export default function CarRow({ car, onChanged, showDealer }: { car: Car; onChanged: () => void; showDealer: boolean }) {
  const toast = useToast();
  const confirm = useConfirm();
  const reject = useRejectCar();
  const isAdmin = useAuth().user?.role === ROLES.admin;
  const [busy, setBusy] = useState(false);
  const st = CAR_STATUS[car.status] ?? CAR_STATUS.active;
  const featured = Boolean(Number(car.is_featured));

  // The ad being changed, shown inside the confirm sheet.
  const detail = (
    <div className="flex items-center gap-3 rounded-2xl bg-muted p-2.5 text-left">
      <CarImage id={car.id} image={car.image} bodyType={car.body_type_name} size="thumb" className="h-12 w-16 shrink-0 rounded-lg" artClassName="w-[80%]" />
      <div className="min-w-0">
        <p className="truncate text-sm font-bold">{carTitle(car)}</p>
        <p className="text-xs font-semibold text-primary">
          {formatPrice(car.price)} <span className="font-medium text-muted-foreground">· #{car.code ?? car.id}</span>
        </p>
      </div>
    </div>
  );

  const run = async (action: () => Promise<void>, done: string, ask?: ConfirmOptions) => {
    if (ask && !(await confirm({ detail, ...ask }))) return;
    setBusy(true);
    try {
      await action();
      toast(done);
      onChanged();
    } catch (err) {
      toast(errorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  };

  const dealerLogo = catalogImage(car.dealer_logo, "dealers");

  return (
    <div className={cn("overflow-hidden rounded-2xl bg-card", busy && "pointer-events-none opacity-60")}>
      {/* Dealer title bar across the card's top, like a status bar, in a muted slate with a soft shadow onto the card.
          Left out when the list is already one dealer's. */}
      {showDealer && (
        <div className="relative z-10 flex items-center gap-2 bg-slate-500 px-3 py-2 text-white shadow-[0_3px_6px_-2px_rgb(0_0_0/0.18)]">
          <Img
            src={dealerLogo}
            className="size-5 shrink-0 rounded-md bg-white object-contain"
            fallback={
              car.dealer_name ? (
                <span className="grid size-5 shrink-0 place-items-center rounded-md bg-amber text-[9px] font-bold text-foreground">{initials(car.dealer_name)}</span>
              ) : (
                <Store className="size-4 shrink-0 text-white/70" />
              )
            }
          />
          <span className={cn("truncate text-xs font-bold", !car.dealer_name && "font-semibold text-white/70")}>{car.dealer_name || "Дилергүй"}</span>
        </div>
      )}
      <div className="p-3">
        <Link href={`/cars/${car.id}`} className="flex gap-3">
          <CarImage id={car.id} image={car.image} bodyType={car.body_type_name} size="thumb" className="h-16 w-20 shrink-0" artClassName="w-[80%]" />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="truncate font-bold">{carTitle(car)}</p>
              <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold", st.className)}>{st.label}</span>
            </div>
            <p className="text-sm font-semibold text-primary">{formatPrice(car.price)}</p>
            <p className="truncate text-xs text-muted-foreground">
              #{car.code ?? car.id} · {car.phonenumber || car.seller_phone}
            </p>
            <p className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1" title="Зар үзсэн">
                <Eye className="size-3.5" />
                {car.view_count ?? 0}
              </span>
              <span className="flex items-center gap-1" title="Дугаар харсан">
                <Phone className="size-3.5" />
                {car.phone_view_count ?? 0}
              </span>
            </p>
            {car.status === "rejected" && car.reject_reason && <p className="mt-1 line-clamp-2 text-xs text-destructive">↩ {car.reject_reason}</p>}
          </div>
        </Link>
        {car.status !== "deleted" && (
          <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
            {car.status === "pending" && isAdmin && (
              <button onClick={() => run(() => approveCar(car.id), "Баталлаа, вэб дээр нийтлэгдлээ", { title: "Зарыг батлах уу?", message: "Батласны дараа вэб дээр нийтлэгдэнэ.", confirmLabel: "Батлах", tone: "success", icon: Check })} className="flex items-center gap-1 rounded-lg bg-success px-3 py-1.5 text-xs font-bold text-white">
                <Check className="size-3.5" strokeWidth={3} />
                Батлах
              </button>
            )}
            {car.status === "pending" && isAdmin && (
              <button
                onClick={async () => {
                  setBusy(true);
                  if (await reject(car, detail)) onChanged();
                  setBusy(false);
                }}
                className="flex items-center gap-1 rounded-lg bg-destructive-soft px-3 py-1.5 text-xs font-bold text-destructive"
              >
                <Undo2 className="size-3.5" />
                Буцаах
              </button>
            )}
            {isAdmin && car.status === "active" && (
              <button
                onClick={() =>
                  run(
                    () => setFeatured(car, !featured),
                    featured ? "Онцлохоос хаслаа" : "Онцоллоо",
                    featured
                      ? { title: "Онцлохоос хасах уу?", message: "Нүүр хуудас болон хайлтын эхэнд гарахаа болино.", confirmLabel: "Хасах", tone: "amber", icon: Star }
                      : { title: "Онцлох зар болгох уу?", message: "Нүүр хуудсанд болон хайлтын эхэнд гарна.", confirmLabel: "Онцлох", tone: "amber", icon: Star }
                  )
                }
                className={cn("flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold", featured ? "bg-amber" : "bg-muted")}
              >
                <Star className={cn("size-3.5", featured && "fill-current")} />
                Онцлох
              </button>
            )}
            {isAdmin && car.status === "active" && (
              <button onClick={() => run(() => markSold(car.id), "Зарагдсан гэж тэмдэглэлээ", { title: "Зарагдсан гэж тэмдэглэх үү?", message: "Зар вэб дээр «Зарагдсан» тэмдэгтэй харагдана.", confirmLabel: "Тэмдэглэх", icon: BadgeCheck })} className="rounded-lg bg-muted px-3 py-1.5 text-xs font-bold">
                Зарагдсан
              </button>
            )}
            {car.status === "active" && (
              <button
                onClick={() =>
                  run(() => setHidden(car.id, true), "Нууллаа, вэб дээр харагдахгүй", {
                    title: "Зарыг түр нуух уу?",
                    message: "Вэб дээр харагдахаа болино. Дараа нь «Нийтлэх»-ээр буцааж нийтэлж болно.",
                    confirmLabel: "Нуух",
                    tone: "amber",
                    icon: EyeOff,
                  })
                }
                className="flex items-center gap-1 rounded-lg bg-muted px-3 py-1.5 text-xs font-bold"
              >
                <EyeOff className="size-3.5" />
                Нуух
              </button>
            )}
            {car.status === "hidden" && (
              <button
                onClick={() =>
                  run(() => setHidden(car.id, false), "Нийтэллээ, вэб дээр харагдана", {
                    title: "Зарыг нийтлэх үү?",
                    message: "Нийтэлсэн зар вэб дээр харагдах боломжтой болно.",
                    confirmLabel: "Нийтлэх",
                    tone: "success",
                    icon: Eye,
                  })
                }
                className="flex items-center gap-1 rounded-lg bg-success px-3 py-1.5 text-xs font-bold text-white"
              >
                <Eye className="size-3.5" />
                Нийтлэх
              </button>
            )}
            {/* Dealers can't delete live or sold ads, only hide / edit them. */}
            {(isAdmin || (car.status !== "active" && car.status !== "sold")) && (
              <button onClick={() => run(() => deleteCar(car.id), "Устгалаа", { title: "Зарыг устгах уу?", message: "Устгасан зар вэб дээр харагдахгүй болно.", confirmLabel: "Устгах", tone: "danger", icon: Trash2 })} className="ml-auto rounded-lg bg-destructive-soft px-3 py-1.5 text-xs font-bold text-destructive">
              Устгах
            </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
