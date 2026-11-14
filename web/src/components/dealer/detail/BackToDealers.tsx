"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

/** "Бүх дилер" link; hidden on phones, which use the app bar's back arrow. */
export default function BackToDealers({ className }: { className?: string }) {
  const { t } = useI18n();
  return (
    <Link
      href="/dealers"
      className={cn("hidden items-center gap-1.5 text-sm font-semibold transition-colors md:inline-flex", className)}
    >
      <ArrowLeft className="size-4" />
      {t("Бүх дилер")}
    </Link>
  );
}
