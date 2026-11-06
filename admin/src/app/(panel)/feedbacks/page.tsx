"use client";

import ChipTabs from "@/components/common/ChipTabs";
import { useConfirm } from "@/components/common/Confirm";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/common/States";
import { errorMessage, useToast } from "@/components/common/Toast";
import PageHeader from "@/components/layout/PageHeader";
import { deleteFeedback, listFeedbacks, setFeedbackStatus } from "@/lib/api/admin";
import type { Feedback } from "@/lib/api/types";
import { useApi } from "@/lib/useApi";
import { useBackTo } from "@/lib/useBackTo";
import { cn, timeAgo } from "@/lib/utils";
import { tr } from "@/lib/i18n/translations";
import { Check, ChevronRight, Mail, Phone, Trash2, Undo2 } from "lucide-react";
import Link from "next/link";
import { Suspense, useState } from "react";

/** One line per feedback, like the Мессеж list; tap opens the whole message (/feedbacks/view, which marks it read). */
function FeedbackRow({ feedback: f, onToggleSeen, onRemove }: { feedback: Feedback; onToggleSeen: () => void; onRemove: () => void }) {
  const isNew = f.status === "new";
  return (
    <article className="px-4 py-3">
      <Link href={`/feedbacks/view?id=${f.id}`} className="flex w-full items-center gap-2 text-left">
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="min-w-0 flex-1 truncate font-bold">{f.name || f.phonenumber || tr("Нэргүй")}</span>
            {f.created_at && <span className="shrink-0 text-[11px] text-muted-foreground">{timeAgo(f.created_at)}</span>}
          </span>
          <span className={cn("mt-0.5 line-clamp-2 break-words text-sm leading-5", isNew ? "font-semibold text-foreground" : "text-muted-foreground")}>{f.message}</span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
      </Link>
      <div className="mt-1.5 flex items-center gap-2">
        <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold", isNew ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
          {isNew ? tr("Шинэ") : tr("Уншсан")}
        </span>
        {f.phonenumber && (
          <a href={`tel:${f.phonenumber}`} className="flex shrink-0 items-center gap-1 text-xs font-semibold hover:text-primary">
            <Phone className="size-3.5" />
            {f.phonenumber}
          </a>
        )}
        {f.email && (
          <a href={`mailto:${f.email}`} className="flex min-w-0 items-center gap-1 text-xs font-semibold hover:text-primary">
            <Mail className="size-3.5 shrink-0" />
            <span className="truncate">{f.email}</span>
          </a>
        )}
        <span className="ml-auto flex shrink-0 items-center">
          <button
            type="button"
            onClick={onToggleSeen}
            aria-label={isNew ? tr("Уншсан болгох") : tr("Шинэ болгох")}
            title={isNew ? tr("Уншсан болгох") : tr("Шинэ болгох")}
            className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {isNew ? <Check className="size-4" /> : <Undo2 className="size-4" />}
          </button>
          <button
            type="button"
            onClick={onRemove}
            aria-label={tr("Устгах")}
            title={tr("Устгах")}
            className="grid size-7 place-items-center rounded-md text-destructive hover:bg-destructive-soft"
          >
            <Trash2 className="size-4" />
          </button>
        </span>
      </div>
    </article>
  );
}

/** Messages sent from the web site's "Бидэнд бичих" form. */
export default function FeedbacksPage() {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <FeedbacksList />
    </Suspense>
  );
}

function FeedbacksList() {
  const { back } = useBackTo("/profile");
  const [status, setStatus] = useState<"" | Feedback["status"]>("");
  const feedbacks = useApi(() => listFeedbacks(status || undefined), status);
  // Badge on the Шинэ tab; refetched with the list so it follows read / unread / delete.
  const newCount = useApi(async () => (await listFeedbacks("new")).rows.length, `${status}:${feedbacks.data?.rows.length ?? ""}:${feedbacks.data?.rows.filter((f) => f.status === "new").length ?? ""}`);
  const tabs: { value: "" | Feedback["status"]; label: string; count?: number }[] = [
    { value: "", label: tr("Бүгд") },
    { value: "new", label: tr("Шинэ"), count: newCount.data },
    { value: "seen", label: tr("Уншсан") },
  ];
  const confirm = useConfirm();
  const toast = useToast();

  const toggleSeen = async (f: Feedback) => {
    try {
      await setFeedbackStatus(f.id, f.status === "new" ? "seen" : "new");
      feedbacks.reload();
    } catch (err) {
      toast(errorMessage(err), "error");
    }
  };

  const remove = async (f: Feedback) => {
    const ok = await confirm({
      title: tr("Санал хүсэлтийг устгах уу?"),
      message: f.message.slice(0, 80),
      confirmLabel: tr("Устгах"),
      tone: "danger",
      icon: Trash2,
    });
    if (!ok) return;
    try {
      await deleteFeedback(f.id);
      toast(tr("Устгалаа"));
      feedbacks.reload();
    } catch (err) {
      toast(errorMessage(err), "error");
    }
  };

  return (
    <>
      <PageHeader title={tr("Санал хүсэлт")} back={back}>
        <ChipTabs items={tabs} value={status} onChange={setStatus} />
      </PageHeader>

      {feedbacks.loading && !feedbacks.data ? (
        <ListSkeleton />
      ) : feedbacks.error ? (
        <ErrorState message={feedbacks.error.message} onRetry={feedbacks.reload} />
      ) : !feedbacks.data?.rows.length ? (
        <EmptyState title={tr("Санал хүсэлт алга")} />
      ) : (
        // Edge to edge, right under the header, like the Мессеж list (cancels main's px-4 and the header's mb-4).
        <div className="-mx-4 -mt-4 divide-y divide-border border-b border-border bg-white">
          {feedbacks.data.rows.map((f) => (
            <FeedbackRow key={f.id} feedback={f} onToggleSeen={() => toggleSeen(f)} onRemove={() => remove(f)} />
          ))}
        </div>
      )}
    </>
  );
}
