"use client";

import { getLocations } from "@/lib/api/cars";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { OptionMenu, type OptionItem } from "@/components/common/Field";
import { useApi } from "@/lib/useApi";
import { cn } from "@/lib/utils";
import { ChevronDown, MapPin } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

/**
 * Header location menu (the same dropdown as the desktop Select). Picking one opens /cars filtered to it;
 * on /cars the other filters are kept. Shows the current pick while on /cars.
 */
export default function LocationPicker() {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const locations = useApi(getLocations);
  const onCars = pathname === "/cars";
  const current = onCars ? (sp.get("location") ?? "") : "";
  const [open, setOpen] = useState(false);
  const [trigger, setTrigger] = useState<HTMLButtonElement | null>(null);

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

  const options: OptionItem[] = [
    { value: "", label: t("Бүх байршил"), text: t("Бүх байршил") },
    ...(locations.data ?? []).map((l) => {
      const name = l.name === "Улаанбаатар" ? t("Улаанбаатар") : l.name;
      return { value: String(l.id), label: name, text: name };
    }),
  ];
  // A linked id shows "…" until the list arrives.
  const currentLabel = options.find((o) => o.value === current)?.text ?? "…";

  return (
    <>
      <button
        ref={setTrigger}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("Байршил")}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "hidden h-9 shrink-0 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground xl:flex",
          open && "bg-muted text-foreground"
        )}
      >
        <MapPin className={cn("size-4", current && "text-primary")} />
        {currentLabel}
        <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
      </button>
      {open && trigger && (
        <OptionMenu
          anchor={trigger}
          label={t("Байршил")}
          options={options}
          value={current}
          onPick={(id) => {
            setOpen(false);
            trigger.focus();
            if (id !== current) pick(id);
          }}
          onClose={() => {
            setOpen(false);
            trigger.focus();
          }}
        />
      )}
    </>
  );
}
