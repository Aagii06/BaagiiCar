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
import { Check, Mail, Phone, Trash2, Undo2 } from "lucide-react";
import { Suspense, useState } from "react";

const STATUS_TABS: { value: "" | Feedback["status"]; label: string }[] = [
  { value: "", label: "Бүгд" },
  { value: "new", label: "Шинэ" },
  { value: "seen", label: "Уншсан" },
];

/** One line per feedback, like the Мессеж list; tap to read the whole message (a new one is then marked read). */
function FeedbackRow({ feedback: f, onToggleSeen, onRemove }: { feedback: Feedback; onToggleSeen: () => void; onRemove: () => void }) {
  const [open, setOpen] = useState(false);
  const isNew = f.status === "new";
  return (
    <article className="px-4 py-3">
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          if (!open && isNew) onToggleSeen();
        }}
        aria-expanded={open}
        className="block w-full text-left"
      >
        <div className="flex items-center gap-2">
          <p className="min-w-0 flex-1 truncate font-bold">{f.name || f.phonenumber || "Нэргүй"}</p>
          {f.created_at && <span className="shrink-0 text-[11px] text-muted-foreground">{timeAgo(f.created_at)}</span>}
        </div>
        <p className={cn("mt-0.5 break-words text-sm leading-5", open ? "whitespace-pre-line" : "line-clamp-2", isNew ? "font-semibold text-foreground" : "text-muted-foreground")}>
          {f.message}
        </p>
      </button>
      <div className="mt-1.5 flex items-center gap-2">
        <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold", isNew ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
          {isNew ? "Шинэ" : "Уншсан"}
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
            aria-label={isNew ? "Уншсан болгох" : "Шинэ болгох"}
            title={isNew ? "Уншсан болгох" : "Шинэ болгох"}
            className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {isNew ? <Check className="size-4" /> : <Undo2 className="size-4" />}
          </button>
          <button
            type="button"
            onClick={onRemove}
            aria-label="Устгах"
            title="Устгах"
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
      title: "Санал хүсэлтийг устгах уу?",
      message: f.message.slice(0, 80),
      confirmLabel: "Устгах",
      tone: "danger",
      icon: Trash2,
    });
    if (!ok) return;
    try {
      await deleteFeedback(f.id);
      toast("Устгалаа");
      feedbacks.reload();
    } catch (err) {
      toast(errorMessage(err), "error");
    }
  };

  return (
    <>
      <PageHeader title="Санал хүсэлт" back={back}>
        <ChipTabs items={STATUS_TABS} value={status} onChange={setStatus} />
      </PageHeader>

      {feedbacks.loading && !feedbacks.data ? (
        <ListSkeleton />
      ) : feedbacks.error ? (
        <ErrorState message={feedbacks.error.message} onRetry={feedbacks.reload} />
      ) : !feedbacks.data?.rows.length ? (
        <EmptyState title="Санал хүсэлт алга" />
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
