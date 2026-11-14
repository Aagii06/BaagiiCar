"use client";

import Container from "@/components/common/Container";
import BackToDealers from "@/components/dealer/detail/BackToDealers";
import DealerPhonePill from "@/components/dealer/detail/DealerPhonePill";
import DealerLogo from "@/components/dealer/DealerLogo";
import { dealerName, type Dealer } from "@/lib/api/dealers";
import { useI18n } from "@/lib/i18n/I18nProvider";

/** Dealer profile band: dark gradient with soft brand-colour glows, white logo tile, name, count, phone pill. */
export default function DealerHero({ dealer }: { dealer: Dealer | undefined }) {
  const { t } = useI18n();
  return (
    <section className="relative isolate overflow-hidden bg-[linear-gradient(135deg,#1b1d24,#23262f_50%,#2e2219)] text-white">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-24 -top-24 size-72 rounded-full bg-primary opacity-30 blur-3xl" />
        <div className="absolute -bottom-32 right-0 size-96 rounded-full bg-amber opacity-20 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/40 to-transparent" />
      </div>
      <Container className="py-6 md:py-10">
        <BackToDealers className="text-white/70 hover:text-white" />
        <div className="flex items-center gap-4 md:mt-6 md:gap-6">
          {dealer ? (
            <DealerLogo dealer={dealer} className="size-20 rounded-2xl bg-white p-2 shadow-lg shadow-black/30 md:size-28" />
          ) : (
            <div className="size-20 shrink-0 animate-pulse rounded-2xl bg-white/15 md:size-28" />
          )}
          <div className="min-w-0">
            {dealer ? (
              <>
                <h1 className="flex flex-wrap items-center gap-3 font-display text-[26px] font-bold leading-tight md:text-[44px]">
                  {dealerName(dealer) || t("Дилер")}
                  <span className="rounded-lg bg-primary px-2.5 py-1 font-sans text-sm font-bold text-white md:text-base">
                    {t("{n} зар", { n: dealer.car_count })}
                  </span>
                </h1>
                {dealer.address && <p className="mt-1.5 text-sm text-white/70">{dealer.address}</p>}
                {dealer.phonenumber && <DealerPhonePill phone={dealer.phonenumber} />}
              </>
            ) : (
              <>
                <div className="h-9 w-56 animate-pulse rounded-lg bg-white/15" />
                <div className="mt-3 h-8 w-36 animate-pulse rounded-full bg-white/10" />
              </>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
