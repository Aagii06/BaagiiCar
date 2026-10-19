"use client";

import ChipTabs from "@/components/common/ChipTabs";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import { errorMessage, useToast } from "@/components/common/Toast";
import PageHeader from "@/components/layout/PageHeader";
import { deleteMessage, listMessages, setMessageStatus } from "@/lib/api/admin";
import type { Message } from "@/lib/api/types";
import { useApi } from "@/lib/useApi";
import { cn, timeAgo } from "@/lib/utils";
import { Check, Phone, RotateCcw, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type Tab = Message["status"] | "all";
const TABS: { value: Tab; label: string }[] = [
  { value: "new", label: "Шинэ" },
  { value: "done", label: "Хариулсан" },
  { value: "all", label: "Бүгд" },
];

function MessageRow({ item, onChanged }: { item: Message; onChanged: () => void }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const isNew = item.status === "new";

  const run = async (action: () => Promise<void>, done: string, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(true);
    try {
      await action();
      toast(done);
      onChanged();
    } catch (err) {
      toast(errorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={cn("rounded-2xl bg-card p-4", busy && "pointer-events-none opacity-60")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-bold">{item.name || "Нэргүй"}</p>
          <a href={`tel:${item.phonenumber}`} className="flex items-center gap-1 text-sm font-semibold text-primary">
            <Phone className="size-3.5" />
            {item.phonenumber}
          </a>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", isNew ? "bg-primary text-white" : "bg-muted")}>{isNew ? "Шинэ" : "Хариулсан"}</span>
          <span className="text-[11px] text-muted-foreground">{timeAgo(item.created_at)}</span>
        </div>
      </div>
      <p className="mt-3 whitespace-pre-line text-sm leading-6">{item.message}</p>
      {item.car_id && (
        <Link href={`/cars/${item.car_id}`} className="mt-2 inline-block text-xs font-semibold text-muted-foreground underline hover:text-foreground">
          Зар #{item.car_id}
        </Link>
      )}
      <div className="mt-3 flex gap-2">
        {isNew ? (
          <button onClick={() => run(() => setMessageStatus(item.id, "done"), "Хариулсан гэж тэмдэглэлээ")} className="flex items-center gap-1 rounded-lg bg-dark px-3 py-2 text-xs font-bold text-white">
            <Check className="size-3.5" />
            Хариулсан
          </button>
        ) : (
          <button onClick={() => run(() => setMessageStatus(item.id, "new"), "Шинэ болголоо")} className="flex items-center gap-1 rounded-lg bg-muted px-3 py-2 text-xs font-bold hover:bg-border">
            <RotateCcw className="size-3.5" />
            Шинэ болгох
          </button>
        )}
        <button
          onClick={() => run(() => deleteMessage(item.id), "Устгалаа", "Мессежийг устгах уу?")}
          aria-label="Устгах"
          className="ml-auto grid size-8 place-items-center rounded-lg text-destructive hover:bg-destructive-soft"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </div>
  );
}

/** Messages left in the web site's chat box; reply by phone, then mark done. */
export default function MessagesPage() {
  const [tab, setTab] = useState<Tab>("new");
  const messages = useApi(() => listMessages(tab === "all" ? undefined : tab), tab);

  return (
    <>
      <PageHeader title="Мессеж">
        <ChipTabs items={TABS} value={tab} onChange={setTab} />
      </PageHeader>

      {messages.loading && !messages.data ? (
        <LoadingState />
      ) : messages.error ? (
        <ErrorState message={messages.error.message} onRetry={messages.reload} />
      ) : !messages.data?.rows.length ? (
        <EmptyState title={tab === "new" ? "Шинэ мессеж алга" : "Мессеж алга"} />
      ) : (
        <div className="space-y-3">
          {messages.data.rows.map((m) => (
            <MessageRow key={m.id} item={m} onChanged={messages.reload} />
          ))}
        </div>
      )}
    </>
  );
}
