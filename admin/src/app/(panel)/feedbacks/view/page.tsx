"use client";

import { useConfirm } from "@/components/common/Confirm";
import { EmptyState, ErrorState, FormSkeleton } from "@/components/common/States";
import { errorMessage, useToast } from "@/components/common/Toast";
import { DetailHeader } from "@/components/layout/PageHeader";
import { deleteFeedback, getFeedback, setFeedbackStatus } from "@/lib/api/admin";
import type { Feedback } from "@/lib/api/types";
import { tr } from "@/lib/i18n/translations";
import { useApi } from "@/lib/useApi";
import { cn, timeAgo } from "@/lib/utils";
import { Check, ChevronRight, Mail, Phone, Reply, Trash2, Undo2, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useRef, useState } from "react";

/**
 * `/feedbacks/view?id=<id>`: one message from the web site's "Бидэнд бичих" form, in full.
 * A query param instead of /feedbacks/[id], so the static export needs no placeholder route.
 * Opening it marks a new one read.
 */
export default function FeedbackViewPage() {
  return (
    <Suspense fallback={<FormSkeleton sections={[4]} />}>
      <FeedbackView />
    </Suspense>
  );
}

function FeedbackView() {
  const id = useSearchParams().get("id") ?? "";
  // Marked read once per visit: a reload after "Шинэ болгох" must not mark it again.
  const markedRead = useRef<string | null>(null);
  const feedback = useApi(async () => {
    const row = id ? await getFeedback(id) : null;
    if (!row || row.status !== "new" || markedRead.current === id) return row;
    markedRead.current = id;
    await setFeedbackStatus(row.id, "seen");
    return { ...row, status: "seen" as const };
  }, id);

  return (
    <>
      <DetailHeader title={tr("Санал хүсэлт")} back="/feedbacks" />
      {feedback.loading && !feedback.data ? (
        <FormSkeleton sections={[4]} />
      ) : feedback.error ? (
        <ErrorState message={feedback.error.message} onRetry={feedback.reload} />
      ) : !feedback.data ? (
        <EmptyState title={tr("Санал хүсэлт олдсонгүй")} />
      ) : (
        <FeedbackDetail feedback={feedback.data} onChanged={feedback.reload} />
      )}
    </>
  );
}

function FeedbackDetail({ feedback: f, onChanged }: { feedback: Feedback; onChanged: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);
  const isNew = f.status === "new";
  const name = f.name || f.phonenumber || f.email || tr("Нэргүй");
  const replyHref = f.email ? `mailto:${f.email}?subject=${encodeURIComponent(`Re: ${tr("Санал хүсэлт")} #${f.id}`)}` : null;

  const toggleSeen = async () => {
    setBusy(true);
    try {
      await setFeedbackStatus(f.id, isNew ? "seen" : "new");
      toast(isNew ? tr("Уншсан болголоо") : tr("Шинэ болголоо"));
      // Back to the list on "Шинэ болгох": staying here would read it again on the next visit anyway.
      if (isNew) onChanged();
      else router.push("/feedbacks");
    } catch (err) {
      toast(errorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
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
      router.push("/feedbacks");
    } catch (err) {
      toast(errorMessage(err), "error");
    }
  };

  return (
    <div className="space-y-3">
      <section className="rounded-2xl bg-card p-4">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="break-words text-lg font-bold">{name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              #{f.id}
              {f.created_at && ` · ${f.created_at.slice(0, 16)} · ${timeAgo(f.created_at)}`}
            </p>
          </div>
          <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold", isNew ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
            {isNew ? tr("Шинэ") : tr("Уншсан")}
          </span>
        </div>
        <p className="mt-4 whitespace-pre-line break-words text-[15px] leading-6">{f.message}</p>
      </section>

      <section className="divide-y divide-border overflow-hidden rounded-2xl bg-card">
        {f.phonenumber && (
          <a href={`tel:${f.phonenumber}`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/60">
            <Phone className="size-5 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1">
              <span className="block text-xs text-muted-foreground">{tr("Утас")}</span>
              <span className="block font-semibold">{f.phonenumber}</span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </a>
        )}
        {f.email && (
          <a href={`mailto:${f.email}`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/60">
            <Mail className="size-5 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1">
              <span className="block text-xs text-muted-foreground">{tr("И-мэйл")}</span>
              <span className="block truncate font-semibold">{f.email}</span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </a>
        )}
        {f.customer_id && (
          <Link href={`/customers/${f.customer_id}`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/60">
            <UserRound className="size-5 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1">
              <span className="block text-xs text-muted-foreground">{tr("Бүртгэлтэй хэрэглэгч")}</span>
              <span className="block font-semibold">{tr("Хэрэглэгчийн мэдээлэл харах")}</span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </Link>
        )}
        {!f.phonenumber && !f.email && !f.customer_id && <p className="px-4 py-3.5 text-sm text-muted-foreground">{tr("Холбоо барих мэдээлэл үлдээгээгүй")}</p>}
      </section>

      {replyHref && (
        <a href={replyHref} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-bold text-white hover:bg-primary-hover">
          <Reply className="size-4" />
          {tr("И-мэйлээр хариулах")}
        </a>
      )}
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={toggleSeen} disabled={busy} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-card font-bold hover:bg-muted disabled:opacity-60">
          {isNew ? <Check className="size-4" /> : <Undo2 className="size-4" />}
          {isNew ? tr("Уншсан болгох") : tr("Шинэ болгох")}
        </button>
        <button type="button" onClick={remove} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-card font-bold text-destructive hover:bg-destructive-soft">
          <Trash2 className="size-4" />
          {tr("Устгах")}
        </button>
      </div>
    </div>
  );
}
