"use client";

import ChipTabs from "@/components/common/ChipTabs";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import { useConfirm, type ConfirmOptions } from "@/components/common/Confirm";
import { errorMessage, useToast } from "@/components/common/Toast";
import PageHeader from "@/components/layout/PageHeader";
import { deleteMessage, listMessages, replyMessage, setMessageStatus } from "@/lib/api/admin";
import { inputClass } from "@/components/common/Field";
import type { Car, Message } from "@/lib/api/types";
import { useApi } from "@/lib/useApi";
import CarImage from "@/components/car/CarImage";
import CarPreviewSheet from "@/components/car/CarPreviewSheet";
import { carTitle, cn, timeAgo } from "@/lib/utils";
import { Check, ChevronRight, Phone, Reply, RotateCcw, SendHorizontal, Trash2 } from "lucide-react";
import { useState } from "react";

type Tab = Message["status"] | "all";
const TABS: { value: Tab; label: string }[] = [
  { value: "all", label: "Бүгд" },
  { value: "new", label: "Шинэ" },
  { value: "done", label: "Хариулсан" },
  { value: "deleted", label: "Устгагдсан" },
];

const BADGE: Record<Message["status"], { label: string; className: string }> = {
  new: { label: "Шинэ", className: "bg-primary text-white" },
  done: { label: "Хариулсан", className: "bg-muted" },
  deleted: { label: "Устгагдсан", className: "bg-destructive-soft text-destructive" },
};

function MessageRow({ item, onChanged, onOpenCar }: { item: Message; onChanged: () => void; onOpenCar: (car: Car) => void }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  /** Reply box open, with its draft (starts from the saved reply when editing it). */
  const [draft, setDraft] = useState<string | null>(null);
  const isNew = item.status === "new";
  const isDeleted = item.status === "deleted";
  const badge = BADGE[item.status] ?? BADGE.done;

  const confirm = useConfirm();
  const run = async (action: () => Promise<void>, done: string, ask?: ConfirmOptions) => {
    if (ask && !(await confirm(ask))) return;
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
    <div className={cn("px-4 py-3.5", busy && "pointer-events-none opacity-60")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-bold">{item.name || "Нэргүй"}</p>
          <a href={`tel:${item.phonenumber}`} className="flex items-center gap-1 text-sm font-semibold text-primary">
            <Phone className="size-3.5" />
            {item.phonenumber}
          </a>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", badge.className)}>{badge.label}</span>
          <span className="text-[11px] text-muted-foreground">{timeAgo(item.created_at)}</span>
          {isDeleted && item.deleted_at && <span className="text-[11px] text-destructive">Устгасан: {timeAgo(item.deleted_at)}</span>}
        </div>
      </div>
      <p className="mt-3 whitespace-pre-line text-sm leading-6">{item.message}</p>
      {item.reply && draft === null && (
        <div className="mt-2 rounded-xl rounded-tl-sm bg-success-soft px-3 py-2">
          <p className="flex items-center gap-1 text-[11px] font-bold text-success">
            <Reply className="size-3" />
            Хариу{item.replied_at && ` · ${timeAgo(item.replied_at)}`}
          </p>
          <p className="mt-0.5 whitespace-pre-line text-sm leading-6">{item.reply}</p>
        </div>
      )}
      {draft !== null && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const text = draft.trim();
            if (text) run(() => replyMessage(item.id, text).then(() => setDraft(null)), "Хариу илгээлээ");
          }}
          className="mt-3 space-y-2"
        >
          <textarea
            className={cn(inputClass, "h-auto min-h-24 resize-y py-2.5 leading-6")}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={2000}
            placeholder="Хариугаа бичнэ үү…"
            aria-label="Хариу"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setDraft(null)} className="rounded-lg bg-muted px-3 py-2 text-xs font-bold hover:bg-border">
              Болих
            </button>
            <button disabled={!draft.trim() || busy} className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white hover:bg-primary-hover disabled:opacity-50">
              <SendHorizontal className="size-3.5" />
              Илгээх
            </button>
          </div>
        </form>
      )}
      {item.car && (
          <button type="button" onClick={() => onOpenCar(item.car!)} className="mt-3 flex w-full items-center gap-3 rounded-xl bg-muted p-2 text-left hover:bg-border">
            <CarImage id={item.car.id} image={item.car.image} bodyType={item.car.body_type_name} size="thumb" className="h-10 w-14 shrink-0" artClassName="w-[80%]" />
            <span className="min-w-0 flex-1 truncate text-sm font-bold">{carTitle(item.car)}</span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </button>
      )}
      <div className={cn("mt-3 flex gap-2", draft !== null && "hidden")}>
        {!isDeleted && (
          <button onClick={() => setDraft(item.reply ?? "")} className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white hover:bg-primary-hover">
            <Reply className="size-3.5" />
            {item.reply ? "Хариу засах" : "Хариулах"}
          </button>
        )}
        {isDeleted ? (
          <button onClick={() => run(() => setMessageStatus(item.id, "new"), "Сэргээлээ")} className="flex items-center gap-1 rounded-lg bg-muted px-3 py-2 text-xs font-bold hover:bg-border">
            <RotateCcw className="size-3.5" />
            Сэргээх
          </button>
        ) : isNew ? (
          // Answered by phone: just mark it done.
          <button onClick={() => run(() => setMessageStatus(item.id, "done"), "Хариулсан гэж тэмдэглэлээ")} className="flex items-center gap-1 rounded-lg bg-muted px-3 py-2 text-xs font-bold hover:bg-border">
            <Check className="size-3.5" />
            Хариулсан
          </button>
        ) : (
          <button onClick={() => run(() => setMessageStatus(item.id, "new"), "Шинэ болголоо")} className="flex items-center gap-1 rounded-lg bg-muted px-3 py-2 text-xs font-bold hover:bg-border">
            <RotateCcw className="size-3.5" />
            Шинэ болгох
          </button>
        )}
        {!isDeleted && (
          <button
            onClick={() => run(() => deleteMessage(item.id), "Устгалаа", { title: "Мессежийг устгах уу?", confirmLabel: "Устгах", tone: "danger", icon: Trash2 })}
            aria-label="Устгах"
            className="ml-auto grid size-8 place-items-center rounded-lg text-destructive hover:bg-destructive-soft"
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/** Messages left in the web site's chat box; answer here (the visitor sees it on the web) or by phone and mark done. */
export default function MessagesPage() {
  const [tab, setTab] = useState<Tab>("all");
  // Tagged with its tab: right after a switch the previous tab's list is still in `messages` and must not show.
  const messages = useApi(() => listMessages(tab === "all" ? undefined : tab).then((res) => ({ ...res, tab })), tab);
  const list = messages.data?.tab === tab ? messages.data : undefined;
  // The ad a message is about, shown in a sheet over the list instead of leaving the page.
  const [preview, setPreview] = useState<Car | null>(null);

  return (
    <>
      <PageHeader>
        <ChipTabs items={TABS} value={tab} onChange={setTab} />
      </PageHeader>

      {messages.error ? (
        <ErrorState message={messages.error.message} onRetry={messages.reload} />
      ) : !list ? (
        <LoadingState />
      ) : !list.rows.length ? (
        <EmptyState title={tab === "new" ? "Шинэ мессеж алга" : tab === "deleted" ? "Устгагдсан мессеж алга" : "Мессеж алга"} />
      ) : (
        // Edge to edge, right under the header, like the Дилерүүд list (cancels main's px-4 and the header's mb-4).
        <div className="-mx-4 -mt-4 divide-y divide-border border-b border-border bg-white">
          {list.rows.map((m) => (
            <MessageRow key={m.id} item={m} onChanged={messages.reload} onOpenCar={setPreview} />
          ))}
        </div>
      )}
      {preview && <CarPreviewSheet car={preview} onClose={() => setPreview(null)} />}
    </>
  );
}
