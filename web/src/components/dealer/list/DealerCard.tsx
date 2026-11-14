"use client";

import DealerLogo from "@/components/dealer/DealerLogo";
import { dealerName, type Dealer } from "@/lib/api/dealers";
import { useI18n } from "@/lib/i18n/I18nProvider";
import Link from "next/link";

/** One dealer in the list: logo, name, ad count, phone. */
export default function DealerCard({ dealer }: { dealer: Dealer }) {
  const { t } = useI18n();
  return (
    <Link
      href={`/dealers?d=${dealer.id}`}
      className="flex items-center gap-4 rounded-2xl border border-border bg-white p-4 transition hover:border-primary hover:shadow-md"
    >
      <DealerLogo dealer={dealer} className="size-16" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold">{dealerName(dealer) || t("Дилер")}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{t("{n} зар", { n: dealer.car_count })}</p>
        {dealer.phonenumber && <p className="mt-1 text-sm text-muted-foreground">{dealer.phonenumber}</p>}
      </div>
    </Link>
  );
}
