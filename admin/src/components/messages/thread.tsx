"use client";

import { inputClass } from "@/components/common/Field";
import type { Car, Message } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { SendHorizontal } from "lucide-react";

export type MessageStatus = Message["status"];

export const BADGE: Record<MessageStatus, { label: string; className: string }> = {
  new: { label: "Шинэ", className: "bg-primary text-white" },
  seen: { label: "Үзсэн", className: "bg-amber-soft text-amber-ink" },
  done: { label: "Хариулсан", className: "bg-success-soft text-success" },
  deleted: { label: "Устгагдсан", className: "bg-destructive-soft text-destructive" },
};

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
