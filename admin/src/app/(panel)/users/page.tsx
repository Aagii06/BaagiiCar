"use client";

import { inputClass } from "@/components/common/Field";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import PageHeader from "@/components/layout/PageHeader";
import { listUsers } from "@/lib/api/admin";
import { ROLES } from "@/lib/constants";
import { useApi } from "@/lib/useApi";
import { cn, initials, userName } from "@/lib/utils";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const ROLE_TONE: Record<string, string> = {
  [ROLES.admin]: "bg-dark text-white",
  [ROLES.dealer]: "bg-amber",
  [ROLES.customer]: "bg-muted",
};

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const users = useApi(() => listUsers(q), q);

  return (
    <>
      <PageHeader
        title="Хэрэглэгч"
        aside={
          <Link href="/users/new" className="flex items-center gap-1 rounded-xl bg-primary px-3 py-2 text-sm font-bold text-white">
            <Plus className="size-4" strokeWidth={2.6} />
            Нэмэх
          </Link>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setQ(search);
          }}
        >
          <input className={inputClass} value={search} onChange={(e) => setSearch(e.target.value)} onBlur={() => setQ(search)} placeholder="Нэр эсвэл утас" />
        </form>
      </PageHeader>

      {users.loading && !users.data ? (
        <LoadingState />
      ) : users.error ? (
        <ErrorState message={users.error.message} onRetry={users.reload} />
      ) : !users.data?.rows.length ? (
        <EmptyState title="Хэрэглэгч олдсонгүй" />
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-2xl bg-card">
          {users.data.rows.map((u) => (
            <Link key={u.id} href={`/users/${u.id}`} className="flex items-center gap-3 px-3 py-3 hover:bg-muted/60">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary">{initials(userName(u))}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{userName(u)}</p>
                <p className="truncate text-xs text-muted-foreground">{[u.phonenumber, u.email].filter(Boolean).join(" · ")}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", ROLE_TONE[u.role ?? ""] ?? "bg-muted")}>{u.role}</span>
                {u.status !== "active" && <span className="text-[10px] font-semibold text-destructive">Идэвхгүй</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
