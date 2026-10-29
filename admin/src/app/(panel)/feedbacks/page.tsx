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
        <>
          <p className="mb-2 text-xs font-semibold text-muted-foreground">{feedbacks.data.count} санал хүсэлт</p>
          <div className="space-y-2">
            {feedbacks.data.rows.map((f) => (
              <article key={f.id} className={cn("rounded-2xl bg-card p-4", f.status === "new" && "ring-2 ring-primary/30")}>
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 truncate font-semibold">
                      {f.name || "Нэргүй"}
                      {f.status === "new" && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">Шинэ</span>}
                    </p>
                    {f.created_at && <p className="text-xs text-muted-foreground">{timeAgo(f.created_at)}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleSeen(f)}
                    aria-label={f.status === "new" ? "Уншсан болгох" : "Шинэ болгох"}
                    title={f.status === "new" ? "Уншсан болгох" : "Шинэ болгох"}
                    className="grid size-9 shrink-0 place-items-center rounded-lg hover:bg-muted"
                  >
                    {f.status === "new" ? <Check className="size-4" /> : <Undo2 className="size-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(f)}
                    aria-label="Устгах"
                    title="Устгах"
                    className="grid size-9 shrink-0 place-items-center rounded-lg text-destructive hover:bg-destructive-soft"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <p className="mt-3 whitespace-pre-line break-words text-sm leading-6">{f.message}</p>
                {(f.phonenumber || f.email) && (
                  <div className="mt-3 flex flex-wrap gap-2 text-sm font-semibold">
                    {f.phonenumber && (
                      <a href={`tel:${f.phonenumber}`} className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-2 hover:bg-border">
                        <Phone className="size-4" />
                        {f.phonenumber}
                      </a>
                    )}
                    {f.email && (
                      <a href={`mailto:${f.email}`} className="flex min-w-0 items-center gap-1.5 rounded-lg bg-muted px-3 py-2 hover:bg-border">
                        <Mail className="size-4 shrink-0" />
                        <span className="truncate">{f.email}</span>
                      </a>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        </>
      )}
    </>
  );
}
