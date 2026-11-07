"use client";

import CarImage from "@/components/car/CarImage";
import { useRejectCar } from "@/components/car/useRejectCar";
import Img from "@/components/common/Img";
import type { ChipTab } from "@/components/common/ChipTabs";
import { useConfirm, type ConfirmOptions } from "@/components/common/Confirm";
import { errorMessage, useToast } from "@/components/common/Toast";
import { approveCar, deleteCar, markSold, renewCar, restoreCar, setFeatured, setHidden, type CarStatusFilter } from "@/lib/api/admin";
import { catalogImage } from "@/lib/api/config";
import type { Car } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/AuthProvider";
import { CAR_RENEW_DAYS, CAR_RESTORE_DAYS, CAR_STATUS, ROLES } from "@/lib/constants";
import { carTitle, cn, daysUntil, formatPrice } from "@/lib/utils";
import { ArchiveRestore, BadgeCheck, Check, Clock, Eye, EyeOff, Phone, RefreshCw, Star, Store, Trash2, Undo2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { tr } from "@/lib/i18n/translations";

export const PAGE_SIZE = 20;
export type Tab = CarStatusFilter | "all";
// Each status in its own colour: soft while off, solid once picked.
export const TABS: ChipTab<Tab>[] = [
  { value: "all", get label() { return tr("Бүгд"); } },
  { value: "pending", get label() { return tr("Хүлээгдэж буй"); }, tone: { on: "bg-amber text-dark", off: "bg-amber-soft text-amber-ink" } },
  { value: "rejected", get label() { return tr("Буцаасан"); }, tone: { on: "bg-destructive text-white", off: "bg-destructive-soft text-destructive" } },
  { value: "active", get label() { return tr("Идэвхтэй"); }, tone: { on: "bg-success text-white", off: "bg-success-soft text-success" } },
  { value: "featured", get label() { return tr("Онцлох"); }, tone: { on: "bg-primary text-white", off: "bg-primary-soft text-primary" } },
  { value: "hidden", get label() { return tr("Нуусан"); }, tone: { on: "bg-slate-500 text-white", off: "bg-slate-100 text-slate-600" } },
  { value: "sold", get label() { return tr("Зарагдсан"); }, tone: { on: "bg-sky-600 text-white", off: "bg-tint-blue text-sky-700" } },
  { value: "deleted", get label() { return tr("Устгасан"); }, tone: { on: "bg-rose-800 text-white", off: "bg-tint-rose text-rose-800" } },
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
  // Days until the ad can be renewed for free again / until a deleted ad is gone for good.
  const renewIn = daysUntil(car.listed_at ?? car.renewed_at ?? car.created_at, CAR_RENEW_DAYS);
  const purgeIn = daysUntil(car.deleted_at, CAR_RESTORE_DAYS);

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
    <div className={cn("relative overflow-hidden rounded-2xl bg-card", busy && "pointer-events-none")} aria-busy={busy || undefined}>
      {/* The action in flight: the card locks under a spinner. */}
      {busy && (
        <div className="absolute inset-0 z-10 grid place-items-center bg-card/60">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      )}
      {/* Dealer title bar across the card's top, like a status bar, in a muted slate with a soft shadow onto the card.
          Left out when the list is already one dealer's. */}
      {showDealer && (
        <div className="relative z-10 flex items-center gap-2 bg-slate-500 px-3 py-2 text-white shadow-[0_3px_6px_-2px_rgb(0_0_0/0.18)]">
          <Img
            src={dealerLogo}
            className="size-5 shrink-0 rounded-md bg-white object-contain"
            // No dealer at all: a shop icon; a dealer without a (working) logo: the "no image" picture.
            fallback={car.dealer_name ? undefined : <Store className="size-4 shrink-0 text-white/70" />}
          />
          <span className={cn("truncate text-xs font-bold", !car.dealer_name && "font-semibold text-white/70")}>{car.dealer_name || tr("Дилергүй")}</span>
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
              <span className="flex items-center gap-1" title={tr("Зар үзсэн")}>
                <Eye className="size-3.5" />
                {car.view_count ?? 0}
              </span>
              <span className="flex items-center gap-1" title={tr("Дугаар харсан")}>
                <Phone className="size-3.5" />
                {car.phone_view_count ?? 0}
              </span>
            </p>
            {car.status === "rejected" && car.reject_reason && <p className="mt-1 line-clamp-2 text-xs text-destructive">↩ {car.reject_reason}</p>}
            {car.status === "active" && (
              <p className={cn("mt-1 flex items-center gap-1 text-xs font-semibold", renewIn ? "text-muted-foreground" : "text-success")}>
                <RefreshCw className="size-3.5" />
                {renewIn ? tr("{n} хоногийн дараа үнэгүй шинэчлэх боломжтой", { n: renewIn }) : tr("Үнэгүй шинэчлэх боломжтой")}
              </p>
            )}
            {car.status === "deleted" && (
              <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-destructive">
                <Clock className="size-3.5" />
                {purgeIn ? tr("{n} хоногийн дараа бүр мөсөн устна", { n: purgeIn }) : tr("Удахгүй бүр мөсөн устна")}
              </p>
            )}
          </div>
        </Link>
        {car.status === "deleted" && purgeIn > 0 && (
          <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
            <button
              onClick={() =>
                run(() => restoreCar(car.id), tr("Зарыг сэргээлээ"), {
                  title: tr("Зарыг сэргээх үү?"),
                  message: tr("Зар устгахаас өмнөх төлөвтөө буцна."),
                  confirmLabel: tr("Сэргээх"),
                  tone: "success",
                  icon: ArchiveRestore,
                })
              }
              className="flex items-center gap-1 rounded-lg bg-success px-3 py-1.5 text-xs font-bold text-white"
            >
              <ArchiveRestore className="size-3.5" />
              {tr("Сэргээх")}
            </button>
          </div>
        )}
        {car.status !== "deleted" && (
          <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
            {car.status === "pending" && isAdmin && (
              <button onClick={() => run(() => approveCar(car.id), tr("Баталлаа, вэб дээр нийтлэгдлээ"), { title: tr("Зарыг батлах уу?"), message: tr("Батласны дараа вэб дээр нийтлэгдэнэ."), confirmLabel: tr("Батлах"), tone: "success", icon: Check })} className="flex items-center gap-1 rounded-lg bg-success px-3 py-1.5 text-xs font-bold text-white">
                <Check className="size-3.5" strokeWidth={3} />
                {tr("Батлах")}
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
                {tr("Буцаах")}
              </button>
            )}
            {isAdmin && car.status === "active" && (
              <button
                onClick={() =>
                  run(
                    () => setFeatured(car, !featured),
                    featured ? tr("Онцлохоос хаслаа") : tr("Онцоллоо"),
                    featured
                      ? { title: tr("Онцлохоос хасах уу?"), message: tr("Нүүр хуудас болон хайлтын эхэнд гарахаа болино."), confirmLabel: tr("Хасах"), tone: "amber", icon: Star }
                      : { title: tr("Онцлох зар болгох уу?"), message: tr("Нүүр хуудсанд болон хайлтын эхэнд гарна."), confirmLabel: tr("Онцлох"), tone: "amber", icon: Star }
                  )
                }
                className={cn("flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold", featured ? "bg-amber" : "bg-muted")}
              >
                <Star className={cn("size-3.5", featured && "fill-current")} />
                {tr("Онцлох")}
              </button>
            )}
            {isAdmin && car.status === "active" && (
              <button onClick={() => run(() => markSold(car.id), tr("Зарагдсан гэж тэмдэглэлээ"), { title: tr("Зарагдсан гэж тэмдэглэх үү?"), message: tr("Зар вэб дээр «Зарагдсан» тэмдэгтэй харагдана."), confirmLabel: tr("Тэмдэглэх"), icon: BadgeCheck })} className="rounded-lg bg-muted px-3 py-1.5 text-xs font-bold">
                {tr("Зарагдсан")}
              </button>
            )}
            {car.status === "active" && !renewIn && (
              <button
                onClick={() =>
                  run(() => renewCar(car.id), tr("Шинэчиллээ, жагсаалтын эхэнд гарлаа"), {
                    title: tr("Зарыг шинэчлэх үү?"),
                    message: tr("Зар жагсаалтын эхэнд гарна. Дараагийн үнэгүй шинэчлэл {n} хоногийн дараа.", { n: CAR_RENEW_DAYS }),
                    confirmLabel: tr("Шинэчлэх"),
                    tone: "success",
                    icon: RefreshCw,
                  })
                }
                className="flex items-center gap-1 rounded-lg bg-success px-3 py-1.5 text-xs font-bold text-white"
              >
                <RefreshCw className="size-3.5" />
                {tr("Шинэчлэх")}
              </button>
            )}
            {car.status === "active" && (
              <button
                onClick={() =>
                  run(() => setHidden(car.id, true), tr("Нууллаа, вэб дээр харагдахгүй"), {
                    title: tr("Зарыг түр нуух уу?"),
                    message: tr("Вэб дээр харагдахаа болино. Дараа нь «Нийтлэх»-ээр буцааж нийтэлж болно."),
                    confirmLabel: tr("Нуух"),
                    tone: "amber",
                    icon: EyeOff,
                  })
                }
                className="flex items-center gap-1 rounded-lg bg-muted px-3 py-1.5 text-xs font-bold"
              >
                <EyeOff className="size-3.5" />
                {tr("Нуух")}
              </button>
            )}
            {car.status === "hidden" && (
              <button
                onClick={() =>
                  run(() => setHidden(car.id, false), tr("Нийтэллээ, вэб дээр харагдана"), {
                    title: tr("Зарыг нийтлэх үү?"),
                    message: tr("Нийтэлсэн зар вэб дээр харагдах боломжтой болно."),
                    confirmLabel: tr("Нийтлэх"),
                    tone: "success",
                    icon: Eye,
                  })
                }
                className="flex items-center gap-1 rounded-lg bg-success px-3 py-1.5 text-xs font-bold text-white"
              >
                <Eye className="size-3.5" />
                {tr("Нийтлэх")}
              </button>
            )}
            {/* Dealers can't delete live or sold ads, only hide / edit them. */}
            {(isAdmin || (car.status !== "active" && car.status !== "sold")) && (
              <button onClick={() => run(() => deleteCar(car.id), tr("Устгалаа"), { title: tr("Зарыг устгах уу?"), message: tr("Устгасан зар вэб дээр харагдахгүй болно. {n} хоногийн дотор сэргээх боломжтой, дараа нь бүр мөсөн устна.", { n: CAR_RESTORE_DAYS }), confirmLabel: tr("Устгах"), tone: "danger", icon: Trash2 })} className="ml-auto rounded-lg bg-destructive-soft px-3 py-1.5 text-xs font-bold text-destructive">
              {tr("Устгах")}
            </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
