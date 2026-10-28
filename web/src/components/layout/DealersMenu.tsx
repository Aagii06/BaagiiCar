"use client";

import DealerAvatar from "@/components/common/DealerAvatar";
import { RowsSkeleton } from "@/components/common/States";
import { dealerName, getDealers } from "@/lib/api/dealers";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useApi } from "@/lib/useApi";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const MENU_DEALERS = 5;

/** Header "Dealers" item: links to /dealers and opens on hover (or keyboard focus) with the top dealers; the list is fetched on first open. */
export default function DealersMenu({ className }: { className?: string }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [requested, setRequested] = useState(false);
  const dealers = useApi(() => (requested ? getDealers() : Promise.resolve(undefined)), requested ? "dealers" : "");
  const ref = useRef<HTMLDivElement>(null);

  const show = () => {
    setOpen(true);
    setRequested(true);
  };

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  // Only the busiest few; the rest are on /dealers ("view all").
  const rows = dealers.data?.rows.slice(0, MENU_DEALERS) ?? [];

  return (
    <div ref={ref} className="relative flex" onMouseEnter={show} onMouseLeave={() => setOpen(false)}>
      {/* Clicking goes to the full list; the dropdown is a hover / focus preview. */}
      <Link
        href="/dealers"
        onClick={() => setOpen(false)}
        onFocus={show}
        aria-expanded={open}
        aria-haspopup="true"
        className={cn("gap-1", className)}
      >
        {t("Дилерүүд")}
        <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
      </Link>

      {open && (
        <div className="absolute left-1/2 top-full z-50 w-80 -translate-x-1/2">
          <div className="overflow-hidden border border-border bg-white shadow-lg">
            <div className="max-h-[60vh] overflow-y-auto">
              {dealers.loading && !dealers.data ? (
                <RowsSkeleton count={4} thumb="avatar" />
              ) : dealers.error ? (
                <p className="px-3 py-4 text-sm text-destructive">{dealers.error.message}</p>
              ) : rows.length ? (
                rows.map((dealer) => {
                  const name = dealerName(dealer) || t("Дилер");
                  return (
                    <Link
                      key={dealer.id}
                      href={`/dealers?d=${dealer.id}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 normal-case tracking-normal hover:bg-muted"
                    >
                      <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-muted">
                        <DealerAvatar
                          logo={dealer.logo}
                          name={name}
                          imgClassName="size-full object-cover"
                          letterClassName="font-display text-base font-bold text-foreground/60"
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-foreground">{name}</span>
                        <span className="block text-xs font-normal text-muted-foreground">{t("{n} зар", { n: dealer.car_count })}</span>
                      </span>
                    </Link>
                  );
                })
              ) : (
                <p className="px-3 py-4 text-sm text-muted-foreground">{t("Бүртгэлтэй дилер алга")}</p>
              )}
            </div>
            <Link
              href="/dealers"
              onClick={() => setOpen(false)}
              className="block border-t border-border px-4 py-3 text-center text-xs font-bold uppercase tracking-[0.12em] text-primary hover:bg-muted"
            >
              {t("Бүгдийг харах")} →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
