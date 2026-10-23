"use client";

import ChipTabs from "@/components/common/ChipTabs";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import { useConfirm, type ConfirmOptions } from "@/components/common/Confirm";
import { errorMessage, useToast } from "@/components/common/Toast";
import PageHeader from "@/components/layout/PageHeader";
import { deleteRows, editMessageReply, listMessages, replyMessage, setMessageStatus } from "@/lib/api/admin";
import { inputClass } from "@/components/common/Field";
import type { Car, Message } from "@/lib/api/types";
import { useApi } from "@/lib/useApi";
import CarImage from "@/components/car/CarImage";
import CarPreviewSheet from "@/components/car/CarPreviewSheet";
import { carTitle, cn, timeAgo } from "@/lib/utils";
import { Check, ChevronRight, Pencil, Phone, RotateCcw, SendHorizontal, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Status = Message["status"];
type Tab = Status | "all";
const TABS: { value: Tab; label: string }[] = [
  { value: "all", label: "Бүгд" },
  { value: "new", label: "Шинэ" },
  { value: "done", label: "Хариулсан" },
  { value: "deleted", label: "Устгагдсан" },
];

const BADGE: Record<Status, { label: string; className: string }> = {
  new: { label: "Шинэ", className: "bg-primary text-white" },
  done: { label: "Хариулсан", className: "bg-muted" },
  deleted: { label: "Устгагдсан", className: "bg-destructive-soft text-destructive" },
};

/**
 * One chat: everything a visitor wrote about one ad (or about nothing in particular), with the team's answers.
 * New while any message in it is unanswered.
 */
interface Thread {
  key: string;
  messages: Message[];
  /** Newest message; new answers are attached to it. */
  last: Message;
  status: Status;
  car?: Car;
  /** created_at of the newest message or answer, for sorting and the row's time. */
  activeAt: string;
}

/** Visitor (signed-in id, else phone) + ad: the backend's grouping too (api/messages threadOf). */
const threadKey = (m: Message) => `${m.created_by ? `u${m.created_by}` : `p${m.phonenumber}`}|${m.car_id ?? 0}`;

function toThreads(rows: Message[]): Thread[] {
  const groups = new Map<string, Message[]>();
  for (const m of rows) {
    const key = threadKey(m);
    groups.set(key, [...(groups.get(key) ?? []), m]);
  }
  return [...groups.entries()]
    .map(([key, list]) => {
      const messages = [...list].sort((a, b) => a.id - b.id);
      const last = messages[messages.length - 1];
      const times = messages.flatMap((m) => [m.created_at, ...(m.replies ?? []).map((r) => r.created_at)]).filter((t): t is string => !!t);
      const status: Status = messages.some((m) => m.status === "new") ? "new" : messages.every((m) => m.status === "deleted") ? "deleted" : "done";
      return { key, messages, last, status, car: messages.find((m) => m.car)?.car, activeAt: times.sort().at(-1) ?? "" };
    })
    .sort((a, b) => b.activeAt.localeCompare(a.activeAt));
}

/** Textarea + Болих / Илгээх for a new answer or the edit of one. */
function ReplyForm({ value, busy, onChange, onCancel, onSubmit }: { value: string; busy: boolean; onChange: (v: string) => void; onCancel?: () => void; onSubmit: (text: string) => void }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) onSubmit(value.trim());
      }}
      className="space-y-2"
    >
      <textarea
        className={cn(inputClass, "h-auto min-h-20 resize-y py-2.5 leading-6")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={2000}
        placeholder="Хариугаа бичнэ үү…"
        aria-label="Хариу"
      />
      <div className="flex justify-end gap-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="rounded-lg bg-muted px-3 py-2 text-xs font-bold hover:bg-border">
            Болих
          </button>
        )}
        <button disabled={!value.trim() || busy} className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white hover:bg-primary-hover disabled:opacity-50">
          <SendHorizontal className="size-3.5" />
          Илгээх
        </button>
      </div>
    </form>
  );
}

/** One line per chat in the list; tapping it opens the chat in a sheet. */
function ThreadRow({ thread, onOpen }: { thread: Thread; onOpen: () => void }) {
  const { last, status, car, messages } = thread;
  const badge = BADGE[status];
  const lastReply = last.replies?.at(-1);
  // The newest line of the chat, ours or theirs.
  const preview = lastReply && (lastReply.created_at ?? "") >= (last.created_at ?? "") ? `Та: ${lastReply.reply}` : last.message;
  return (
    <button type="button" onClick={onOpen} className="block w-full px-4 py-3 text-left hover:bg-muted/60">
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
    </button>
  );
}

/** A chat in a bottom sheet: the visitor's messages and our answers in order, with the actions for the whole chat. */
function ThreadSheet({ thread, onChanged, onOpenCar, onClose, carOpen }: { thread: Thread; onChanged: () => void; onOpenCar: (car: Car) => void; onClose: () => void; carOpen: boolean }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState("");
  /** The answer being edited, with its draft. */
  const [editing, setEditing] = useState<{ id: number; text: string } | null>(null);
  const { messages, last, status, car } = thread;
  const isDeleted = status === "deleted";
  const ids = messages.map((m) => m.id);

  // Esc closes the sheet, unless the ad preview is open on top of it (that one closes first).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !carOpen && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [carOpen, onClose]);
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

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
  const setAll = (next: Status, done: string) => run(() => Promise.all(ids.map((id) => setMessageStatus(id, next))), done);

  // The visitor's messages and our answers, oldest first.
  const lines = messages
    .flatMap((m) => [
      { kind: "in" as const, id: `m${m.id}`, text: m.message, at: m.created_at ?? "" },
      ...(m.replies ?? []).map((r) => ({ kind: "out" as const, id: `r${r.id}`, reply: r, text: r.reply, at: r.created_at ?? "" })),
    ])
    .sort((a, b) => a.at.localeCompare(b.at));

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 animate-fade-in bg-dark/50 backdrop-blur-[2px]" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="thread-title"
        className={cn("absolute inset-x-0 bottom-0 mx-auto flex max-h-[92vh] max-w-md animate-sheet-up flex-col rounded-t-3xl bg-background shadow-2xl", busy && "pointer-events-none")}
      >
        <header className="rounded-t-3xl border-b border-border bg-white px-4 pb-3 pt-3">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border" />
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p id="thread-title" className="truncate font-bold">
                {last.name || "Нэргүй"}
              </p>
              <a href={`tel:${last.phonenumber}`} className="flex items-center gap-1 text-sm font-semibold text-primary">
                <Phone className="size-3.5" />
                {last.phonenumber}
              </a>
            </div>
            <span className={cn("mt-1 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold", BADGE[status].className)}>{BADGE[status].label}</span>
            <button type="button" onClick={onClose} aria-label="Хаах" className="grid size-9 shrink-0 place-items-center rounded-full bg-muted hover:bg-border">
              <X className="size-4" />
            </button>
          </div>
          {car && (
            <button type="button" onClick={() => onOpenCar(car)} className="mt-3 flex w-full items-center gap-3 rounded-xl bg-muted p-2 text-left hover:bg-border">
              <CarImage id={car.id} image={car.image} bodyType={car.body_type_name} size="thumb" className="h-10 w-14 shrink-0" artClassName="w-[80%]" />
              <span className="min-w-0 flex-1 truncate text-sm font-bold">{carTitle(car)}</span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </button>
          )}
        </header>

        <div className={cn("min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-4", busy && "opacity-60")}>
          {lines.map((line) =>
            line.kind === "in" ? (
              <div key={line.id} className="flex flex-col items-start">
                <p className="max-w-[85%] whitespace-pre-line rounded-2xl rounded-bl-md bg-white px-3.5 py-2 text-sm leading-6 shadow-sm">{line.text}</p>
                <span className="mt-0.5 px-1 text-[11px] text-muted-foreground">{timeAgo(line.at)}</span>
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
        </div>

        <footer className="space-y-3 border-t border-border bg-white px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
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
            ) : status === "new" ? (
              // Answered by phone: just mark it done.
              <button onClick={() => setAll("done", "Хариулсан гэж тэмдэглэлээ")} className="flex items-center gap-1 rounded-lg bg-muted px-3 py-2 text-xs font-bold hover:bg-border">
                <Check className="size-3.5" />
                Хариулсан
              </button>
            ) : (
              <button onClick={() => setAll("new", "Шинэ болголоо")} className="flex items-center gap-1 rounded-lg bg-muted px-3 py-2 text-xs font-bold hover:bg-border">
                <RotateCcw className="size-3.5" />
                Шинэ болгох
              </button>
            )}
            {!isDeleted && (
              <button
                onClick={() =>
                  run(() => deleteRows("messages", ids), "Устгалаа", { title: "Чатыг устгах уу?", message: "Энэ чатын бүх мессеж устгагдана.", confirmLabel: "Устгах", tone: "danger", icon: Trash2 }).then(
                    (ok) => ok && onClose()
                  )
                }
                aria-label="Чат устгах"
                className="ml-auto grid size-8 place-items-center rounded-lg text-destructive hover:bg-destructive-soft"
              >
                <Trash2 className="size-4" />
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}

/** Chats from the web site's chat box, one per visitor and ad; answer here (the visitor sees it on the web) or by phone and mark done. */
export default function MessagesPage() {
  const [tab, setTab] = useState<Tab>("all");
  // Every message the tab can need (a chat's older, answered messages too); the tab then filters whole chats.
  const source = tab === "deleted" ? "deleted" : "live";
  // Tagged with what it holds: right after a switch the previous list is still in `messages` and must not show.
  const messages = useApi(() => listMessages(source === "deleted" ? "deleted" : undefined).then((res) => ({ ...res, source })), source);
  const loaded = messages.data?.source === source ? messages.data : undefined;
  const allThreads = useMemo(() => (loaded ? toThreads(loaded.rows) : undefined), [loaded]);
  const threads = allThreads && (tab === "new" || tab === "done" ? allThreads.filter((t) => t.status === tab) : allThreads);
  // The ad a chat is about, shown in a sheet over the list instead of leaving the page.
  const [preview, setPreview] = useState<Car | null>(null);
  // The open chat: its fresh version after a reload, else the one tapped (it may have left this tab, e.g. answered under Шинэ).
  const [opened, setOpened] = useState<Thread | null>(null);
  const open = opened && (allThreads?.find((t) => t.key === opened.key) ?? opened);

  return (
    <>
      <PageHeader>
        <ChipTabs items={TABS} value={tab} onChange={setTab} />
      </PageHeader>

      {messages.error ? (
        <ErrorState message={messages.error.message} onRetry={messages.reload} />
      ) : !threads ? (
        <LoadingState />
      ) : !threads.length ? (
        <EmptyState title={tab === "new" ? "Шинэ мессеж алга" : tab === "deleted" ? "Устгагдсан мессеж алга" : "Мессеж алга"} />
      ) : (
        // Edge to edge, right under the header, like the Дилерүүд list (cancels main's px-4 and the header's mb-4).
        <div className="-mx-4 -mt-4 divide-y divide-border border-b border-border bg-white">
          {threads.map((t) => (
            <ThreadRow key={t.key} thread={t} onOpen={() => setOpened(t)} />
          ))}
        </div>
      )}
      {open && <ThreadSheet key={open.key} thread={open} onChanged={messages.reload} onOpenCar={setPreview} onClose={() => setOpened(null)} carOpen={!!preview} />}
      {preview && <CarPreviewSheet car={preview} onClose={() => setPreview(null)} />}
    </>
  );
}
