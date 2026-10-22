"use client";

import ChipTabs from "@/components/common/ChipTabs";
import { inputClass } from "@/components/common/Field";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import PageHeader from "@/components/layout/PageHeader";
import UserAvatar from "@/components/common/UserAvatar";
import { listDealers, listUsers } from "@/lib/api/admin";
import { useAuth } from "@/lib/auth/AuthProvider";
import { ROLE_LIST, roleLabel, ROLES } from "@/lib/constants";
import { useApi } from "@/lib/useApi";
import { cn, userName } from "@/lib/utils";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const ROLE_TONE: Record<string, string> = {
  [ROLES.admin]: "bg-dark text-white",
  [ROLES.dealer]: "bg-amber",
};

const ROLE_TABS = [{ value: "", label: "Бүгд" }, ...ROLE_LIST.map((r) => ({ value: r as string, label: roleLabel(r) }))];

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const { user } = useAuth();
  const users = useApi(() => listUsers(q, user?.id, role || undefined), `${q}|${role}|${user?.id ?? ""}`);
  const dealers = useApi(() => listDealers());
  const dealerNames = new Map(dealers.data?.rows.map((d) => [d.id, d.name]));

  return (
    <>
      <PageHeader
        title="Admin & Dealer"
        back="/profile"
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
        <ChipTabs items={ROLE_TABS} value={role} onChange={setRole} />
      </PageHeader>

      {users.loading && !users.data ? (
        <LoadingState />
      ) : users.error ? (
        <ErrorState message={users.error.message} onRetry={users.reload} />
      ) : !users.data?.rows.length ? (
        <EmptyState title="Хэрэглэгч олдсонгүй" />
      ) : (
        // Edge to edge, right under the header (cancels main's px-4 and the header's mb-4).
        <div className="-mx-4 -mt-4 divide-y divide-border border-b border-border bg-white">
          {users.data.rows.map((u) => (
            <Link key={u.id} href={`/users/${u.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/60">
              <UserAvatar user={u} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{userName(u)}</p>
                <p className="truncate text-xs text-muted-foreground">{[u.phonenumber, u.email, dealerNames.get(u.dealer_id ?? 0)].filter(Boolean).join(" · ")}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", ROLE_TONE[u.role ?? ""] ?? "bg-muted")}>{roleLabel(u.role)}</span>
                {u.status !== "active" && <span className="text-[10px] font-semibold text-destructive">Идэвхгүй</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
