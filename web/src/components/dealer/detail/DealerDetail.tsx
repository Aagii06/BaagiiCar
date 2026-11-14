"use client";

import Container from "@/components/common/Container";
import { ErrorState } from "@/components/common/States";
import BackToDealers from "@/components/dealer/detail/BackToDealers";
import DealerCars from "@/components/dealer/detail/DealerCars";
import DealerHero from "@/components/dealer/detail/DealerHero";
import { getDealer } from "@/lib/api/dealers";
import { useApi } from "@/lib/useApi";

/** One dealer: profile hero and the ads they own or posted. */
export default function DealerDetail({ id, page }: { id: number; page: number }) {
  const dealer = useApi(() => getDealer(id), String(id));

  if (dealer.error)
    return (
      <Container className="pt-4 md:pt-12">
        <BackToDealers className="text-muted-foreground hover:text-foreground" />
        <ErrorState className="mt-6" message={dealer.error.message} onRetry={dealer.reload} />
      </Container>
    );

  return (
    <>
      <DealerHero dealer={dealer.data} />
      <Container className="mt-6 md:mt-10">
        <DealerCars id={id} page={page} />
      </Container>
    </>
  );
}
