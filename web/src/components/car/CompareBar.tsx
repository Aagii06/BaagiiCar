"use client";

import { COMPARE_MAX, useCompare } from "@/lib/compare/CompareProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { ArrowRight, GitCompare, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/** Floating pill shown while cars are picked for comparison (hidden on the compare page itself). */
export default function CompareBar() {
  const { ids, clear } = useCompare();
  const { t } = useI18n();
  const pathname = usePathname();
  if (!ids.length || pathname.startsWith("/compare")) return null;
  return (
    // Mobile: above the tab bar, leaving the chat button its corner. Desktop: bottom centre.
    <div className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] left-4 right-20 z-40 flex justify-center md:bottom-6 md:left-1/2 md:right-auto md:-translate-x-1/2">
      <div className="flex w-full items-center gap-1.5 rounded-2xl bg-dark p-1.5 pl-4 text-white shadow-2xl shadow-black/30 md:w-auto">
        <GitCompare className="size-4 shrink-0 text-white/70" />
        <span className="mr-auto whitespace-nowrap text-sm font-semibold md:mr-3">
          {ids.length}
          <span className="text-white/50"> / {COMPARE_MAX}</span>
        </span>
        <span className="hidden gap-1 sm:flex">
          {Array.from({ length: COMPARE_MAX }, (_, i) => (
            <span key={i} className={cn("h-1.5 w-4 rounded-full", i < ids.length ? "bg-primary" : "bg-white/20")} />
          ))}
        </span>
        <Link
          href="/compare"
          className="ml-2 flex h-9 items-center gap-1.5 whitespace-nowrap rounded-xl bg-primary px-3.5 text-sm font-bold hover:bg-primary-hover"
        >
          {t("Харьцуулалт")}
          <ArrowRight className="size-4" />
        </Link>
        <button type="button" onClick={clear} title={t("Цэвэрлэх")} aria-label={t("Цэвэрлэх")} className="grid size-9 shrink-0 place-items-center rounded-xl text-white/70 hover:bg-white/10 hover:text-white">
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
