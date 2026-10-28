"use client";

import ChipTabs from "@/components/common/ChipTabs";
import { EmptyState, ErrorState, ThreadListSkeleton } from "@/components/common/States";
import PageHeader from "@/components/layout/PageHeader";
import { BADGE, toThreads, type MessageStatus, type Thread } from "@/components/messages/thread";
import { listMessages } from "@/lib/api/admin";
import { useApi } from "@/lib/useApi";
import { carTitle, cn, timeAgo } from "@/lib/utils";
import Link from "next/link";
import { useMemo, useState } from "react";

type Tab = MessageStatus | "all";
const TABS: { value: Tab; label: string }[] = [
  { value: "all", label: "Бүгд" },
  { value: "new", label: "Шинэ" },
  { value: "seen", label: "Үзсэн" },
  { value: "done", label: "Хариулсан" },
  { value: "deleted", label: "Устгагдсан" },
];

/** One line per chat; opens the chat page. */
function ThreadRow({ thread }: { thread: Thread }) {
  const { last, status, car, messages } = thread;
  const badge = BADGE[status];
  const lastReply = last.replies?.at(-1);
  // The newest line of the chat, ours or theirs.
  const preview = lastReply && (lastReply.created_at ?? "") >= (last.created_at ?? "") ? `Та: ${lastReply.reply}` : last.message;
  return (
    <Link href={`/messages/thread?m=${last.id}`} className="block px-4 py-3 hover:bg-muted/60">
      <div className="flex items-center gap-2">
        <p className="min-w-0 flex-1 truncate font-bold">{last.name || last.phonenumber || "Нэргүй"}</p>
        <span className="shrink-0 text-[11px] text-muted-foreground">{timeAgo(thread.activeAt)}</span>
      </div>
      <p className={cn("mt-0.5 line-clamp-2 text-sm leading-5", status === "new" ? "font-semibold text-foreground" : "text-muted-foreground")}>{preview}</p>
      <div className="mt-1.5 flex items-center gap-2">
        <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold", badge.className)}>{badge.label}</span>
        {car && <span className="min-w-0 truncate text-xs font-semibold">{carTitle(car)}</span>}
        {messages.length > 1 && <span className="ml-auto shrink-0 text-xs font-semibold text-muted-foreground">{messages.length} мессеж</span>}
      </div>
    </Link>
  );
}

/** Chats from the web site's chat box, one per visitor and ad; answer them on the chat page (the visitor sees it on the web). */
export default function MessagesPage() {
  const [tab, setTab] = useState<Tab>("all");
  // Every message the tab can need (a chat's older, answered messages too); the tab then filters whole chats.
  const source = tab === "deleted" ? "deleted" : "live";
  // Tagged with what it holds: right after a switch the previous list is still in `messages` and must not show.
  const messages = useApi(() => listMessages(source === "deleted" ? "deleted" : undefined).then((res) => ({ ...res, source })), source);
  const loaded = messages.data?.source === source ? messages.data : undefined;
  const allThreads = useMemo(() => (loaded ? toThreads(loaded.rows) : undefined), [loaded]);
  const threads = allThreads && (tab === "all" || tab === "deleted" ? allThreads : allThreads.filter((t) => t.status === tab));

  return (
    <>
      <PageHeader>
        <ChipTabs items={TABS} value={tab} onChange={setTab} />
      </PageHeader>

      {messages.error ? (
        <ErrorState message={messages.error.message} onRetry={messages.reload} />
      ) : !threads ? (
        <ThreadListSkeleton />
      ) : !threads.length ? (
        <EmptyState title={tab === "all" ? "Мессеж алга" : `${TABS.find((t) => t.value === tab)?.label} мессеж алга`} />
      ) : (
        // Edge to edge, right under the header, like the Дилерүүд list (cancels main's px-4 and the header's mb-4).
        <div className="-mx-4 -mt-4 divide-y divide-border border-b border-border bg-white">
          {threads.map((t) => (
            <ThreadRow key={t.key} thread={t} />
          ))}
        </div>
      )}
    </>
  );
}
