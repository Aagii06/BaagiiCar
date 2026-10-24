"use client";

import ChipTabs from "@/components/common/ChipTabs";
import { inputClass } from "@/components/common/Field";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import { CustomerAvatar, customerName } from "@/components/customer/CustomerAvatar";
import PageHeader from "@/components/layout/PageHeader";
import { listCustomers } from "@/lib/api/admin";
import type { Customer } from "@/lib/api/types";
import { useApi } from "@/lib/useApi";
import { useBackTo, withFrom } from "@/lib/useBackTo";
import { timeAgo } from "@/lib/utils";
import Link from "next/link";
import { Suspense, useState } from "react";

const STATUS_TABS: { value: "" | Customer["status"]; label: string }[] = [
  { value: "", label: "Бүгд" },
  { value: "active", label: "Идэвхтэй" },
  { value: "inactive", label: "Идэвхгүй" },
];

/** Web visitors (`customers` table): they sign up themselves with a one-time code. */
export default function CustomersPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <CustomersList />
    </Suspense>
  );
}

function CustomersList() {
  // Opened from home (`?from=home`) → back returns there, else to Профайл.
  const { from, back } = useBackTo("/profile");
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"" | Customer["status"]>("");
  const customers = useApi(() => listCustomers(q, status || undefined), `${q}|${status}`);

  return (
    <>
      <PageHeader title="Хэрэглэгч" back={back}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setQ(search);
          }}
        >
          <input className={inputClass} value={search} onChange={(e) => setSearch(e.target.value)} onBlur={() => setQ(search)} placeholder="Нэр, утас эсвэл и-мэйл" />
        </form>
        <ChipTabs items={STATUS_TABS} value={status} onChange={setStatus} />
      </PageHeader>

      {customers.loading && !customers.data ? (
        <LoadingState />
      ) : customers.error ? (
        <ErrorState message={customers.error.message} onRetry={customers.reload} />
      ) : !customers.data?.rows.length ? (
        <EmptyState title="Хэрэглэгч олдсонгүй" />
      ) : (
        <>
          <p className="mb-2 text-xs font-semibold text-muted-foreground">{customers.data.count} хэрэглэгч</p>
          {/* Edge to edge, like the Admin & Dealer list. */}
          <div className="-mx-4 divide-y divide-border border-y border-border bg-white">
            {customers.data.rows.map((c) => (
              <Link key={c.id} href={withFrom(`/customers/${c.id}`, from)} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/60">
                <CustomerAvatar customer={c} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{customerName(c)}</p>
                  <p className="truncate text-xs text-muted-foreground">{[c.phonenumber, c.email].filter(Boolean).join(" · ")}</p>
                </div>
                <div className="flex flex-col items-end gap-1 text-[10px]">
                  {c.last_login_at && <span className="text-muted-foreground">{timeAgo(c.last_login_at)}</span>}
                  {c.status !== "active" && <span className="font-semibold text-destructive">Идэвхгүй</span>}
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  );
}
