"use client";

import { inputClass } from "@/components/common/Field";
import type { Car, Message } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { SendHorizontal, Loader2 } from "lucide-react";
import { tr } from "@/lib/i18n/translations";

export type MessageStatus = Message["status"];

/**
 * Each status's colours, used everywhere a chat's status shows: `className` for the badge, `dot` its bullet,
 * `bar` the row's left stripe, `row` the row tint (new only), `tone` the filter chip.
 */
export const BADGE: Record<MessageStatus, { label: string; className: string; dot: string; bar: string; row?: string; tone: { on: string; off: string } }> = {
  new: {
    get label() { return tr("Шинэ"); },
    className: "bg-primary text-white",
    dot: "bg-white",
    bar: "bg-primary",
    row: "bg-primary-soft/60 hover:bg-primary-soft",
    tone: { on: "bg-primary text-white", off: "bg-primary-soft text-primary hover:bg-primary/15" },
  },
  seen: {
    get label() { return tr("Үзсэн"); },
    className: "bg-amber-soft text-amber-ink",
    dot: "bg-amber",
    bar: "bg-amber",
    tone: { on: "bg-amber text-amber-ink", off: "bg-amber-soft text-amber-ink hover:bg-amber/30" },
  },
  done: {
    get label() { return tr("Хариулсан"); },
    className: "bg-success-soft text-success",
    dot: "bg-success",
    bar: "bg-success",
    tone: { on: "bg-success text-white", off: "bg-success-soft text-success hover:bg-success/15" },
  },
  deleted: {
    get label() { return tr("Устгагдсан"); },
    className: "bg-destructive-soft text-destructive",
    dot: "bg-destructive",
    bar: "bg-destructive",
    tone: { on: "bg-destructive text-white", off: "bg-destructive-soft text-destructive hover:bg-destructive/15" },
  },
};

/** Status pill with a coloured bullet. */
export function StatusBadge({ status }: { status: MessageStatus }) {
  const b = BADGE[status];
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold", b.className)}>
      <span className={cn("size-1.5 rounded-full", b.dot)} />
      {b.label}
    </span>
  );
}

/**
 * One chat: everything a visitor wrote about one ad (or about nothing in particular), with the team's answers.
 * New while any message in it is unread, then Үзсэн until it's answered (a new message makes it new again).
 */
export interface Thread {
  key: string;
  messages: Message[];
  /** Newest message; new answers are attached to it. */
  last: Message;
  status: MessageStatus;
  car?: Car;
  /** created_at of the newest message or answer, for sorting and the row's time. */
  activeAt: string;
}

/** Visitor (signed-in id, else phone) + ad: the backend's grouping too (api/messages threadOf). */
const threadKey = (m: Message) => `${m.created_by ? `u${m.created_by}` : `p${m.phonenumber}`}|${m.car_id ?? 0}`;

/** Groups messages into chats, the most recently active first. */
export function toThreads(rows: Message[]): Thread[] {
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
      const has = (s: MessageStatus) => messages.some((m) => m.status === s);
      const status: MessageStatus = has("new") ? "new" : has("seen") ? "seen" : messages.every((m) => m.status === "deleted") ? "deleted" : "done";
      return { key, messages, last, status, car: messages.find((m) => m.car)?.car, activeAt: times.sort().at(-1) ?? "" };
    })
    .sort((a, b) => b.activeAt.localeCompare(a.activeAt));
}

/** Textarea + Болих / Илгээх for a new answer or the edit of one. */
export function ReplyForm({
  value,
  busy,
  onChange,
  onCancel,
  onSubmit,
}: {
  value: string;
  busy: boolean;
  onChange: (v: string) => void;
  onCancel?: () => void;
  onSubmit: (text: string) => void;
}) {
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
        placeholder={tr("Хариугаа бичнэ үү…")}
        aria-label={tr("Хариу")}
      />
      <div className="flex justify-end gap-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="rounded-lg bg-muted px-3 py-2 text-xs font-bold hover:bg-border">
            {tr("Болих")}
          </button>
        )}
        <button disabled={!value.trim() || busy} className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white hover:bg-primary-hover disabled:opacity-50">
          {busy ? <Loader2 className="size-3.5 animate-spin" /> : <SendHorizontal className="size-3.5" />}
          {tr("Илгээх")}
        </button>
      </div>
    </form>
  );
}
