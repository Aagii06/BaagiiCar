"use client";

import { getLocations } from "@/lib/api/cars";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useApi } from "@/lib/useApi";
import { ChevronDown, MapPin } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Header location menu. Picking one opens /cars filtered to it; on /cars the
 * other filters are kept. Shows the current pick while on /cars.
 */
export default function LocationPicker() {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const locations = useApi(getLocations);
  const onCars = pathname === "/cars";
  const current = onCars ? (sp.get("location") ?? "") : "";

  const pick = (id: string) => {
    const q = new URLSearchParams(onCars ? sp.toString() : "");
    if (id) q.set("location", id);
    else q.delete("location");
    q.delete("page");
    const qs = q.toString();
    const href = `/cars${qs ? `?${qs}` : ""}`;
    if (onCars) router.replace(href);
    else router.push(href);
  };

  return (
    <label className="relative hidden shrink-0 items-center gap-1.5 text-sm font-medium text-foreground/80 hover:text-foreground xl:flex">
      <MapPin className="size-4" />
      <select
        value={current}
        onChange={(e) => pick(e.target.value)}
        aria-label={t("Байршил")}
        className="cursor-pointer appearance-none bg-transparent pr-5 outline-none"
      >
        <option value="">{t("Бүх байршил")}</option>
        {locations.data?.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name === "Улаанбаатар" ? t("Улаанбаатар") : l.name}
          </option>
        ))}
        {/* Keep a linked id visible before the list arrives. */}
        {!locations.data && current && <option value={current}>…</option>}
      </select>
      <ChevronDown className="pointer-events-none absolute right-0 size-3.5" />
    </label>
  );
}
