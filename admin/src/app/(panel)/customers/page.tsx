"use client";

import ChipTabs from "@/components/common/ChipTabs";
import { useConfirm } from "@/components/common/Confirm";
import { inputClass } from "@/components/common/Field";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/common/States";
import { errorMessage, useToast } from "@/components/common/Toast";
import { CustomerAvatar, customerName } from "@/components/customer/CustomerAvatar";
import PageHeader from "@/components/layout/PageHeader";
import { deleteCustomer, listCustomers } from "@/lib/api/admin";
import type { Customer } from "@/lib/api/types";
import { useApi } from "@/lib/useApi";
import { useBackTo, withFrom } from "@/lib/useBackTo";
import { timeAgo } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import Link from "next/link";
import { Suspense, useState } from "react";

const STATUS_TABS: { value: "" | Customer["status"]; label: string }[] = [
  { value: "", label: "Бүгд" },
  { value: "active", label: "Идэвхтэй" },
  { value: "inactive", label: "Идэвхгүй" },
  { value: "blocked", label: "Блоклогдсон" },
];

/** Web visitors (`customers` table): they sign up themselves with a one-time code. */
export default function CustomersPage() {
  return (
    <Suspense fallback={<ListSkeleton />}>
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
  const confirm = useConfirm();
  const toast = useToast();

  const remove = async (c: Customer) => {
    const ok = await confirm({
      title: "Хэрэглэгчийг устгах уу?",
      message: `${customerName(c)} — дахин нэвтэрч чадахгүй болно.`,
      confirmLabel: "Устгах",
      tone: "danger",
      icon: Trash2,
    });
    if (!ok) return;
    try {
      await deleteCustomer(c.id);
      toast("Устгалаа");
      customers.reload();
    } catch (err) {
      toast(errorMessage(err), "error");
    }
  };

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
        <ListSkeleton />
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
              // The delete button sits beside the link, not inside it: a button can't be nested in an <a>.
              <div key={c.id} className="flex items-center hover:bg-muted/60">
                <Link href={withFrom(`/customers/${c.id}`, from)} className="flex min-w-0 flex-1 items-center gap-3 py-3 pl-4">
                  <CustomerAvatar customer={c} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{customerName(c)}</p>
                    <p className="truncate text-xs text-muted-foreground">{[c.phonenumber, c.email].filter(Boolean).join(" · ")}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-[10px]">
                    {c.last_login_at && <span className="text-muted-foreground">{timeAgo(c.last_login_at)}</span>}
                    {c.status !== "active" && <span className="font-semibold text-destructive">{c.status === "blocked" ? "Блоклогдсон" : "Идэвхгүй"}</span>}
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => remove(c)}
                  aria-label={`${customerName(c)} устгах`}
                  className="mx-2 grid size-9 shrink-0 place-items-center rounded-lg text-destructive hover:bg-destructive-soft"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
