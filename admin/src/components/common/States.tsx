import { cn } from "@/lib/utils";
import { AlertCircle, Loader2 } from "lucide-react";

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("size-6 animate-spin text-primary", className)} />;
}

export function ErrorState({ message, onRetry, className }: { message: string; onRetry?: () => void; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center gap-3 rounded-2xl bg-card px-6 py-12 text-center", className)}>
      <AlertCircle className="size-8 text-destructive" />
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="rounded-xl border-[1.5px] border-foreground px-4 py-2 text-sm font-bold hover:bg-muted">
          Дахин оролдох
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-2 rounded-2xl bg-card px-6 py-14 text-center", className)}>
      <p className="font-bold">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

/*
 * Loading skeletons: grey stand-ins shaped like the content they replace, so the page doesn't jump when it lands.
 * Each mirrors one layout (sizes, paddings, edge-to-edge lists) — keep them in step with the real markup.
 */

/** Grey bar standing in for a line of text, an image or a control. */
function Bone({ className }: { className?: string }) {
  return <div className={cn("rounded bg-muted", className)} />;
}

/** Самбар's stat tiles: the summary row (3 for admins, 1 for dealers) and the 4 ad-status tiles. */
export function StatsSkeleton({ admin }: { admin: boolean }) {
  return (
    <div className="animate-pulse space-y-2" role="status" aria-label="Ачаалж байна">
      <div className={cn("grid gap-2", admin ? "grid-cols-3" : "grid-cols-1")}>
        {Array.from({ length: admin ? 3 : 1 }, (_, i) => (
          <div key={i} className="rounded-2xl bg-card p-3.5">
            <Bone className="h-8 w-12" />
            <Bone className="mt-1 h-4 w-16" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="rounded-2xl bg-card px-2.5 py-3">
            <Bone className="h-8 w-8" />
            <Bone className="mt-1 h-3.5 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Small ad lines of the Самбар (thumb, title, price, status pill). */
export function CarLinesSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="animate-pulse space-y-2" role="status" aria-label="Ачаалж байна">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-2xl bg-card p-2.5">
          <Bone className="h-12 w-16 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1">
            <Bone className="h-4 w-3/5" />
            <Bone className="mt-1.5 h-3 w-2/5" />
          </div>
          <Bone className="h-4 w-14 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/** Ad cards of the Зарууд list (CarRow): count line, then cards with the action bar. */
export function CarRowsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="animate-pulse" role="status" aria-label="Ачаалж байна">
      <Bone className="mb-2 h-4 w-12" />
      <div className="space-y-3">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="rounded-2xl bg-card p-3">
            <div className="flex gap-3">
              <Bone className="h-16 w-20 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <Bone className="h-5 w-3/5" />
                  <Bone className="h-4 w-14 rounded-full" />
                </div>
                <Bone className="mt-1.5 h-4 w-1/3" />
                <Bone className="mt-1.5 h-3 w-1/2" />
              </div>
            </div>
            <div className="mt-3 flex gap-2 border-t border-border pt-3">
              <Bone className="h-7 w-20 rounded-lg" />
              <Bone className="h-7 w-20 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Rows of a people / dealer / catalog list: avatar, two lines. `className` is the list's own wrapper
 * (most are edge to edge), `rowClassName` the row padding, `avatar` the avatar's shape or none.
 */
export function ListSkeleton({
  count = 8,
  avatar = "round",
  className = "-mx-4 divide-y divide-border border-y border-border bg-white",
  rowClassName = "px-4 py-3",
}: {
  count?: number;
  avatar?: "round" | "square" | false;
  className?: string;
  rowClassName?: string;
}) {
  return (
    <div className={cn("animate-pulse", className)} role="status" aria-label="Ачаалж байна">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={cn("flex items-center gap-3", rowClassName)}>
          {avatar && <Bone className={cn("size-10 shrink-0", avatar === "round" ? "rounded-full" : "rounded-xl")} />}
          <div className="min-w-0 flex-1">
            {/* Varied widths so the rows don't read as a striped block. */}
            <Bone className={cn("h-4", ["w-2/5", "w-1/2", "w-1/3"][i % 3])} />
            <Bone className={cn("mt-1.5 h-3", ["w-3/5", "w-2/5", "w-1/2"][i % 3])} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Chats of the Мессеж list: name and time, two preview lines, status badge. */
export function ThreadListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="-mx-4 -mt-4 animate-pulse divide-y divide-border border-b border-border bg-white" role="status" aria-label="Ачаалж байна">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="px-4 py-3">
          <div className="flex items-center gap-2">
            <Bone className={cn("h-4", ["w-1/3", "w-2/5", "w-1/4"][i % 3])} />
            <Bone className="ml-auto h-3 w-10" />
          </div>
          <Bone className="mt-2 h-3.5 w-full" />
          <Bone className="mt-1.5 h-3.5 w-2/3" />
          <Bone className="mt-2 h-4 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/** One chat: the visitor's bubbles on the left, our answers on the right. */
export function ChatSkeleton() {
  return (
    <div className="animate-pulse space-y-3" role="status" aria-label="Ачаалж байна">
      <Bone className="h-16 rounded-2xl bg-card" />
      {["mr-auto w-3/4", "ml-auto w-2/3", "mr-auto w-1/2", "ml-auto w-3/5"].map((c, i) => (
        <Bone key={i} className={cn("h-14 rounded-2xl", i % 2 ? "bg-primary-soft" : "bg-card", c)} />
      ))}
    </div>
  );
}

/** Edit forms (ad, user, dealer, customer): white sections of label + field pairs; `sections` lists each one's field count. */
export function FormSkeleton({ sections = [5] }: { sections?: number[] }) {
  return (
    <div className="animate-pulse space-y-4" role="status" aria-label="Ачаалж байна">
      {sections.map((fields, i) => (
        <section key={i} className="space-y-4 rounded-2xl bg-card p-4">
          {Array.from({ length: fields }, (_, j) => (
            <div key={j}>
              <Bone className="mb-1.5 h-3.5 w-20" />
              <Bone className="h-12 rounded-xl" />
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}

/** An ad's read-only page: photo, then the title / price card and the seller card (side column on desktop). */
export function CarDetailSkeleton() {
  return (
    <div className="mx-auto max-w-[1280px] animate-pulse md:px-6" role="status" aria-label="Ачаалж байна">
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_380px] lg:items-start lg:gap-6">
        <Bone className="aspect-[4/3] rounded-2xl bg-card" />
        <div className="space-y-4">
          <div className="rounded-2xl bg-card p-4 md:p-5">
            <Bone className="h-6 w-3/4" />
            <Bone className="mt-2 h-4 w-1/3" />
            <Bone className="mt-3 h-8 w-1/2" />
            <Bone className="mt-3 h-3 w-2/5" />
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-card p-4 md:p-5">
            <div className="flex-1">
              <Bone className="h-4 w-1/2" />
              <Bone className="mt-1.5 h-3 w-1/3" />
            </div>
            <Bone className="size-10 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Grey placeholder grid shown while car lists load. */
export function CardGridSkeleton({ count = 6, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="animate-pulse rounded-2xl bg-card p-3">
          <div className="aspect-[4/3] rounded-xl bg-muted" />
          <div className="mt-4 h-4 w-2/3 rounded bg-muted" />
          <div className="mt-3 grid grid-cols-4 gap-1.5">
            {Array.from({ length: 4 }, (_, j) => (
              <div key={j} className="h-12 rounded-lg bg-muted" />
            ))}
          </div>
          <div className="mt-4 h-10 rounded-xl bg-muted" />
        </div>
      ))}
    </div>
  );
}
