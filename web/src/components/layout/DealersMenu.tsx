"use client";

import Img from "@/components/common/Img";
import { Spinner } from "@/components/common/States";
import { uploadUrl } from "@/lib/api/config";
import { dealerName, getDealers } from "@/lib/api/dealers";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useApi } from "@/lib/useApi";
import { cn } from "@/lib/utils";
import { ChevronDown, Store } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

/** Header "Dealers" item: opens on hover (or click / keyboard) with the dealer list; the list is fetched on first open. */
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

  const rows = dealers.data?.rows ?? [];

  return (
    <div ref={ref} className="relative flex" onMouseEnter={show} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : show())}
        aria-expanded={open}
        aria-haspopup="true"
        className={cn("gap-1", className)}
      >
        {t("Дилерүүд")}
        <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        // pt-2 instead of a margin keeps the pointer inside while moving down to the panel.
        <div className="absolute left-1/2 top-full z-50 w-80 -translate-x-1/2 pt-2">
          <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-lg">
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {dealers.loading && !dealers.data ? (
                <div className="grid place-items-center py-8">
                  <Spinner />
                </div>
              ) : dealers.error ? (
                <p className="px-3 py-4 text-sm text-destructive">{dealers.error.message}</p>
              ) : rows.length ? (
                rows.map((dealer) => {
                  const name = dealerName(dealer) || t("Дилер");
                  const logo = uploadUrl(dealer.logo, "full", "users");
                  return (
                    <Link
                      key={dealer.id}
                      href={`/dealers?d=${dealer.id}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-2.5 py-2 normal-case tracking-normal hover:bg-muted"
                    >
                      <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-muted">
                        {logo ? <Img src={logo} alt="" className="size-full object-contain" /> : <Store className="size-5 text-muted-foreground" />}
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
