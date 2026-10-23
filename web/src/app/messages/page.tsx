"use client";

import { carTitle } from "@/components/car/CarCard";
import CarImage from "@/components/car/CarImage";
import Container from "@/components/common/Container";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import { getCarsByIds } from "@/lib/api/cars";
import { ApiError } from "@/lib/api/client";
import { getMyMessages, markRead, sendMessage, type MyMessage } from "@/lib/api/messages";
import type { Car } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useApi } from "@/lib/useApi";
import { cn, timeAgo } from "@/lib/utils";
import { ChevronRight, MessageCircle, SendHorizontal } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

/** One ad's messages (oldest first); `carId` 0 = general questions. */
interface Thread {
  carId: number;
  car?: Car;
  messages: MyMessage[];
}

function threadTitle(thread: Thread, t: ReturnType<typeof useI18n>["t"]) {
  return thread.car ? `${carTitle(thread.car, t)} ${thread.car.manufactured_year ?? ""}`.trim() : t("Ерөнхий асуулт");
}

function Status({ done }: { done: boolean }) {
  const { t } = useI18n();
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", done ? "bg-success-soft text-success" : "bg-amber-soft text-amber-ink")}>
      {done ? t("Холбогдсон") : t("Хүлээгдэж байна")}
    </span>
  );
}

/** List of conversations; `?car=<id>` opens one, where the visitor can keep writing. */
function MessagesInner() {
  const { t } = useI18n();
  const router = useRouter();
  const sp = useSearchParams();
  const open = sp.get("car");
  const { user, token, ready, signOut } = useAuth();

  useEffect(() => {
    if (ready && !user) router.replace(`/login?next=${encodeURIComponent(`/messages${open ? `?car=${open}` : ""}`)}`);
  }, [ready, user, open, router]);

  const threads = useApi(async () => {
    if (!token) return undefined;
    const rows = await getMyMessages(token);
    const ids = [...new Set(rows.map((m) => m.car_id).filter((id): id is number => !!id))];
    const cars = new Map((await getCarsByIds(ids)).map((c) => [c.id, c]));
    // Rows come newest first, so threads are ordered by their latest message.
    const byCar = new Map<number, Thread>();
    for (const m of rows) {
      const key = m.car_id ?? 0;
      if (!byCar.has(key)) byCar.set(key, { carId: key, car: cars.get(key), messages: [] });
      byCar.get(key)!.messages.unshift(m);
    }
    return [...byCar.values()];
  }, token ?? "");

  // Expired session: back to the code sign-in.
  useEffect(() => {
    if (threads.error instanceof ApiError && threads.error.status === 401) signOut();
  }, [threads.error, signOut]);

  if (!ready || !user || (threads.loading && !threads.data)) return <LoadingState className="min-h-[50vh]" />;
  if (threads.error) return <Container className="pt-4"><ErrorState message={threads.error.message} onRetry={threads.reload} /></Container>;

  const list = threads.data ?? [];
  // Phones: the list, or one thread (`?car=`). From md: list on the left, the open thread (or the latest) on the right.
  const selectedId = open !== null ? Number(open) || 0 : list[0]?.carId;
  const selected = selectedId === undefined ? undefined : (list.find((th) => th.carId === selectedId) ?? { carId: selectedId, messages: [] });

  return (
    <Container className="max-w-[1024px] pt-3 md:pt-10">
      <div className="mb-6 hidden items-end justify-between gap-4 md:flex">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("Мессеж")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("Зарын талаарх асуулт, хариултууд")}</p>
        </div>
        {!!list.length && <span className="text-sm text-muted-foreground">{t("{n} ярилцлага", { n: list.length })}</span>}
      </div>

      {!list.length && open === null ? (
        <EmptyState
          title={t("Мессеж алга")}
          description={t("Зар дээрх чат товчоор асуултаа илгээгээрэй.")}
          action={<Link href="/cars" className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white">{t("Машин хайх")}</Link>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-[320px_1fr] md:items-start">
          <ul className={cn("overflow-hidden rounded-2xl bg-card md:sticky md:top-28", open !== null && "hidden md:block")}>
            {list.map((th) => {
              const last = th.messages[th.messages.length - 1];
              const preview = last.reply ? `${t("Хариу")}: ${last.reply}` : last.message;
              const unread = th.messages.reduce((n, m) => n + (m.unread ?? 0), 0);
              const active = th.carId === selectedId;
              return (
                <li key={th.carId} className="border-b border-border last:border-b-0">
                  <Link
                    href={`/messages?car=${th.carId}`}
                    replace={open !== null}
                    scroll={false}
                    className={cn("flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted", active && "md:bg-primary-soft md:hover:bg-primary-soft")}
                  >
                    {th.car ? (
                      <CarImage id={th.car.id} image={th.car.image} bodyType={th.car.body_type_name} size="thumb" className="h-11 w-14 shrink-0 rounded-lg" artClassName="w-9" />
                    ) : (
                      <span className="grid h-11 w-14 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                        <MessageCircle className="size-5" />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="min-w-0 flex-1 truncate text-sm font-bold">{threadTitle(th, t)}</span>
                        <span className="shrink-0 text-[11px] text-muted-foreground">{timeAgo(last.replied_at || last.created_at, t)}</span>
                      </span>
                      <span className="mt-1 flex items-center gap-2">
                        <span className={cn("min-w-0 flex-1 truncate text-[13px]", unread ? "font-semibold text-foreground" : "text-muted-foreground")}>{preview}</span>
                        {unread ? (
                          <span className="grid min-w-5 place-items-center rounded-full bg-primary px-1.5 py-0.5 text-[11px] font-bold text-white">{unread}</span>
                        ) : (
                          <Status done={last.status === "done" || !!last.reply} />
                        )}
                      </span>
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground md:hidden" />
                  </Link>
                </li>
              );
            })}
          </ul>

          {selected && (
            <ThreadView
              key={selected.carId}
              thread={selected}
              token={token!}
              onSent={threads.reload}
              className={cn(open === null && "hidden md:flex")}
            />
          )}
        </div>
      )}
    </Container>
  );
}

/** One conversation: the visitor's messages as chat bubbles, and a box to keep writing about the same ad. */
function ThreadView({ thread, token, onSent, className }: { thread: Thread; token: string; onSent: () => void; className?: string }) {
  const { t } = useI18n();
  const { signOut } = useAuth();
  const [draft, setDraft] = useState("");
  const [sent, setSent] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const end = useRef<HTMLDivElement>(null);
  const replies = thread.messages.filter((m) => m.reply).length;

  // Scroll only the thread box (not the page) to the newest line.
  useEffect(() => {
    const box = end.current?.parentElement;
    if (box && box.scrollHeight > box.clientHeight) box.scrollTop = box.scrollHeight;
    else end.current?.scrollIntoView({ block: "end" });
  }, [thread.messages.length, sent.length, replies]);

  // Opening the thread reads its answers on the server (clears the unread badges), then refreshes.
  const hasUnread = thread.messages.some((m) => m.unread);
  useEffect(() => {
    if (hasUnread) markRead(thread.carId, token).then(onSent, () => {});
  }, [hasUnread, thread.carId, token, onSent]);

  // Pick up the team's answers while the thread is open.
  useEffect(() => {
    const timer = window.setInterval(onSent, 15000);
    return () => window.clearInterval(timer);
  }, [onSent]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || busy) return;
    setBusy(true);
    setError(null);
    try {
      await sendMessage({ type: "car", message: text, car_id: thread.carId || undefined, page_url: window.location.href }, token);
      setSent((s) => [...s, text]);
      setDraft("");
      onSent();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) signOut();
      else setError(err instanceof Error ? err.message : t("Алдаа гарлаа"));
    } finally {
      setBusy(false);
    }
  };

  // Freshly sent lines show at once; the reload then brings them in as real messages.
  const pending = sent.filter((s) => !thread.messages.some((m) => m.message === s));

  return (
    <section className={cn("flex flex-col md:h-[calc(100dvh-13rem)] md:min-h-[480px] md:overflow-hidden md:rounded-2xl md:bg-card", className)}>
      {thread.car ? (
        <Link
          href={`/cars/${thread.car.id}`}
          className="flex shrink-0 items-center gap-3 rounded-2xl bg-card p-3 hover:bg-muted md:rounded-none md:border-b md:border-border md:px-5"
        >
          <CarImage id={thread.car.id} image={thread.car.image} bodyType={thread.car.body_type_name} size="thumb" className="h-11 w-14 shrink-0 rounded-lg" artClassName="w-9" />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-bold">{threadTitle(thread, t)}</span>
            <span className="block text-xs text-muted-foreground">{t("Ажлын цагаар утсаар эргэн холбогдоно")}</span>
          </span>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        </Link>
      ) : (
        <div className="hidden shrink-0 border-b border-border px-5 py-4 md:block">
          <p className="font-bold">{threadTitle(thread, t)}</p>
          <p className="text-xs text-muted-foreground">{t("Ажлын цагаар утсаар эргэн холбогдоно")}</p>
        </div>
      )}

      <div className="mt-4 flex-1 space-y-3 pb-28 md:mt-0 md:overflow-y-auto md:bg-background/60 md:p-5 md:pb-5" aria-live="polite">
        {thread.messages.map((m) => (
          <div key={m.id} className="flex flex-col items-end gap-1">
            <p className="max-w-[85%] whitespace-pre-line rounded-2xl rounded-br-md bg-primary px-3.5 py-2 text-[15px] text-white md:max-w-[70%]">{m.message}</p>
            <span className="flex items-center gap-2 text-[11px] text-muted-foreground">
              {timeAgo(m.created_at, t)}
              {!m.reply && <Status done={m.status === "done"} />}
            </span>
            {m.reply && (
              <div className="mt-1 flex w-full flex-col items-start gap-1">
                <p className="max-w-[85%] whitespace-pre-line rounded-2xl rounded-bl-md bg-white px-3.5 py-2 text-[15px] text-foreground shadow-sm md:max-w-[70%]">{m.reply}</p>
                <span className="text-[11px] text-muted-foreground">
                  {thread.car?.dealer_name || "Cardealer"} · {timeAgo(m.replied_at, t)}
                </span>
              </div>
            )}
          </div>
        ))}
        {pending.map((text, i) => (
          <div key={`p${i}`} className="flex justify-end">
            <p className="max-w-[85%] whitespace-pre-line rounded-2xl rounded-br-md bg-primary/80 px-3.5 py-2 text-[15px] text-white md:max-w-[70%]">{text}</p>
          </div>
        ))}
        {!thread.messages.length && !pending.length && <p className="py-8 text-center text-sm text-muted-foreground">{t("Асуултаа бичээд илгээнэ үү.")}</p>}
        <div ref={end} />
      </div>

      {/* Phones: pinned above the tab bar; from md: the bottom of the thread panel. */}
      <form
        onSubmit={send}
        className="fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 shrink-0 border-t border-border bg-white p-3 md:static md:px-5"
      >
        {error && <p className="mb-2 text-xs font-medium text-destructive">{error}</p>}
        <div className="mx-auto flex max-w-[1024px] gap-2">
          <input
            className="h-11 min-w-0 flex-1 rounded-lg border border-input bg-white px-3.5 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={2000}
            placeholder={t("Мессеж бичих…")}
            aria-label={t("Мессеж")}
          />
          <button disabled={busy || !draft.trim()} aria-label={t("Илгээх")} className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary text-white disabled:opacity-50">
            <SendHorizontal className="size-4" />
          </button>
        </div>
      </form>
    </section>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<LoadingState className="min-h-[50vh]" />}>
      <MessagesInner />
    </Suspense>
  );
}
