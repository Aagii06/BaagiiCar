"use client";

import CarImage from "@/components/car/CarImage";
import CarPreviewSheet from "@/components/car/CarPreviewSheet";
import { useConfirm, type ConfirmOptions } from "@/components/common/Confirm";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import { errorMessage, useToast } from "@/components/common/Toast";
import { DetailHeader } from "@/components/layout/PageHeader";
import { BADGE, ReplyForm, toThreads, type MessageStatus, type Thread } from "@/components/messages/thread";
import { deleteRows, editMessageReply, getMessageThread, replyMessage, setMessageStatus } from "@/lib/api/admin";
import type { Car } from "@/lib/api/types";
import { useApi } from "@/lib/useApi";
import { carTitle, cn, timeAgo } from "@/lib/utils";
import { Check, ChevronRight, Pencil, Phone, RotateCcw, Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useRef, useState } from "react";

/**
 * `/messages/thread?m=<message id>`: one chat (the visitor's messages about one ad and our answers) as its own page.
 * A query param instead of /messages/[id], so the static export needs no placeholder route.
 */
export default function ThreadPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ThreadInner />
    </Suspense>
  );
}

function ThreadInner() {
  const id = useSearchParams().get("m") ?? "";
  // Chat already marked read on this visit: a reload after "Уншаагүй болгох" must not mark it again.
  const markedRead = useRef<string | null>(null);
  const thread = useApi(async () => {
    const rows = id ? await getMessageThread(id) : null;
    if (!rows?.length) return null;
    // Opening the chat reads it: Шинэ → Үзсэн (answering then makes it Хариулсан).
    const unread = rows.filter((m) => m.status === "new");
    if (!unread.length || markedRead.current === id) return toThreads(rows)[0];
    markedRead.current = id;
    await Promise.all(unread.map((m) => setMessageStatus(m.id, "seen")));
    return toThreads(rows.map((m) => (m.status === "new" ? { ...m, status: "seen" as const } : m)))[0];
  }, id);

  return (
    <>
      <DetailHeader title={thread.data?.last.name || thread.data?.last.phonenumber || "Мессеж"} back="/messages" />
      {thread.loading && !thread.data ? (
        <LoadingState />
      ) : thread.error ? (
        <ErrorState message={thread.error.message} onRetry={thread.reload} />
      ) : !thread.data ? (
        <EmptyState title="Мессеж олдсонгүй" />
      ) : (
        <ThreadView thread={thread.data} onChanged={thread.reload} />
      )}
    </>
  );
}

/** The visitor's messages and our answers in order, with the actions for the whole chat. */
function ThreadView({ thread, onChanged }: { thread: Thread; onChanged: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState("");
  /** The answer being edited, with its draft. */
  const [editing, setEditing] = useState<{ id: number; text: string } | null>(null);
  // The ad, in a sheet over the chat.
  const [preview, setPreview] = useState<Car | null>(null);
  const { messages, last, status, car } = thread;
  const isDeleted = status === "deleted";
  const ids = messages.map((m) => m.id);

  const run = async (action: () => Promise<unknown>, done: string, ask?: ConfirmOptions) => {
    if (ask && !(await confirm(ask))) return false;
    setBusy(true);
    try {
      await action();
      toast(done);
      onChanged();
      return true;
    } catch (err) {
      toast(errorMessage(err), "error");
      return false;
    } finally {
      setBusy(false);
    }
  };
  /** Status of every message in the chat (Хариулсан / Шинэ болгох / Сэргээх). */
  const setAll = (next: MessageStatus, done: string) => run(() => Promise.all(ids.map((mid) => setMessageStatus(mid, next))), done);

  // The visitor's messages and our answers, oldest first.
  const lines = messages
    .flatMap((m) => [
      { kind: "in" as const, id: `m${m.id}`, text: m.message, at: m.created_at ?? "", deleted: m.status === "deleted" },
      ...(m.replies ?? []).map((r) => ({ kind: "out" as const, id: `r${r.id}`, reply: r, text: r.reply, at: r.created_at ?? "" })),
    ])
    .sort((a, b) => a.at.localeCompare(b.at));

  return (
    <div className={cn("space-y-4", busy && "pointer-events-none")}>
      <section className="rounded-2xl bg-card p-4">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold">{last.name || "Нэргүй"}</p>
            <a href={`tel:${last.phonenumber}`} className="flex items-center gap-1 text-sm font-semibold text-primary">
              <Phone className="size-3.5" />
              {last.phonenumber}
            </a>
          </div>
          <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold", BADGE[status].className)}>{BADGE[status].label}</span>
        </div>
        {car && (
          <button type="button" onClick={() => setPreview(car)} className="mt-3 flex w-full items-center gap-3 rounded-xl bg-muted p-2 text-left hover:bg-border">
            <CarImage id={car.id} image={car.image} bodyType={car.body_type_name} size="thumb" className="h-10 w-14 shrink-0" artClassName="w-[80%]" />
            <span className="min-w-0 flex-1 truncate text-sm font-bold">{carTitle(car)}</span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </button>
        )}
      </section>

      <section className={cn("space-y-2", busy && "opacity-60")}>
        {lines.map((line) =>
          line.kind === "in" ? (
            <div key={line.id} className="flex flex-col items-start">
              <p className={cn("max-w-[85%] whitespace-pre-line rounded-2xl rounded-bl-md bg-white px-3.5 py-2 text-sm leading-6 shadow-sm", line.deleted && "opacity-60")}>{line.text}</p>
              <span className="mt-0.5 px-1 text-[11px] text-muted-foreground">
                {timeAgo(line.at)}
                {line.deleted && " · устгагдсан"}
              </span>
            </div>
          ) : editing?.id === line.reply.id ? (
            <ReplyForm
              key={line.id}
              value={editing.text}
              busy={busy}
              onChange={(text) => setEditing({ id: line.reply.id, text })}
              onCancel={() => setEditing(null)}
              onSubmit={(text) => run(() => editMessageReply(line.reply.id, text), "Хариуг засварлалаа").then((ok) => ok && setEditing(null))}
            />
          ) : (
            <div key={line.id} className="flex flex-col items-end">
              <div className="flex max-w-[85%] items-start gap-1 rounded-2xl rounded-br-md bg-success-soft py-2 pl-3.5 pr-1">
                <p className="min-w-0 flex-1 whitespace-pre-line text-sm leading-6">{line.text}</p>
                {!isDeleted && (
                  <button
                    type="button"
                    onClick={() => setEditing({ id: line.reply.id, text: line.reply.reply })}
                    aria-label="Хариу засах"
                    className="grid size-7 shrink-0 place-items-center rounded-lg text-success hover:bg-success/10"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                )}
              </div>
              <span className="mt-0.5 px-1 text-[11px] text-muted-foreground">
                {timeAgo(line.at)}
                {line.reply.updated_at && line.reply.updated_at !== line.reply.created_at && " · засварласан"}
              </span>
            </div>
          )
        )}
      </section>

      <section className="space-y-3 rounded-2xl bg-card p-4">
        {/* Any number of answers; each goes to the visitor and answers the whole chat. */}
        {!isDeleted && !editing && (
          <ReplyForm value={draft} busy={busy} onChange={setDraft} onSubmit={(text) => run(() => replyMessage(last.id, text), "Хариу илгээлээ").then((ok) => ok && setDraft(""))} />
        )}
        <div className="flex gap-2">
          {isDeleted ? (
            <button onClick={() => setAll("new", "Сэргээлээ")} className="flex items-center gap-1 rounded-lg bg-muted px-3 py-2 text-xs font-bold hover:bg-border">
              <RotateCcw className="size-3.5" />
              Сэргээх
            </button>
          ) : status === "new" || status === "seen" ? (
            // Answered by phone: just mark it done.
            <button onClick={() => setAll("done", "Хариулсан гэж тэмдэглэлээ")} className="flex items-center gap-1 rounded-lg bg-muted px-3 py-2 text-xs font-bold hover:bg-border">
              <Check className="size-3.5" />
              Хариулсан
            </button>
          ) : (
            <button onClick={() => setAll("new", "Шинэ болголоо")} className="flex items-center gap-1 rounded-lg bg-muted px-3 py-2 text-xs font-bold hover:bg-border">
              <RotateCcw className="size-3.5" />
              Уншаагүй болгох
            </button>
          )}
          {!isDeleted && (
            <button
              onClick={() =>
                run(() => deleteRows("messages", ids), "Устгалаа", { title: "Чатыг устгах уу?", message: "Энэ чатын бүх мессеж устгагдана.", confirmLabel: "Устгах", tone: "danger", icon: Trash2 }).then(
                  (ok) => ok && router.push("/messages")
                )
              }
              aria-label="Чат устгах"
              className="ml-auto grid size-8 place-items-center rounded-lg text-destructive hover:bg-destructive-soft"
            >
              <Trash2 className="size-4" />
            </button>
          )}
        </div>
      </section>

      {preview && <CarPreviewSheet car={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}
