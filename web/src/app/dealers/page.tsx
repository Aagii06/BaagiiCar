"use client";

import DealerDetail from "@/components/dealer/detail/DealerDetail";
import DealerList from "@/components/dealer/list/DealerList";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

/** `/dealers` lists dealers; `/dealers?d=<id>[&page=<n>]` shows one dealer. */
function DealersInner() {
  const sp = useSearchParams();
  const id = Number(sp.get("d"));
  const page = Math.max(Number(sp.get("page")) || 1, 1);
  return Number.isInteger(id) && id > 0 ? <DealerDetail id={id} page={page} /> : <DealerList />;
}

export default function DealersPage() {
  return (
    <Suspense fallback={null}>
      <DealersInner />
    </Suspense>
  );
}
