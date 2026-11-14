"use client";

import Container from "@/components/common/Container";
import PageBanner from "@/components/common/PageBanner";
import DealerGrid from "@/components/dealer/list/DealerGrid";
import FeaturedCars from "@/components/dealer/list/FeaturedCars";
import { getDealers } from "@/lib/api/dealers";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useApi } from "@/lib/useApi";

/** Registered dealers, most listings first; featured cars below. */
export default function DealerList() {
  const { t } = useI18n();
  const dealers = useApi(getDealers);
  const rows = dealers.data?.rows;

  return (
    <>
      <PageBanner
        title={t("Дилерүүд")}
        image="showroom"
        imagePosition="object-[center_62%]"
        aside={dealers.loading ? "…" : t("{n} дилер", { n: rows?.length ?? 0 })}
        asideLoading={dealers.loading}
      />
      <Container className="pt-4 md:pt-8">
        <DealerGrid rows={rows} loading={dealers.loading} error={dealers.error} onRetry={dealers.reload} />
      </Container>
      <FeaturedCars />
    </>
  );
}
