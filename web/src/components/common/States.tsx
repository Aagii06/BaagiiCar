"use client";

import Container from "@/components/common/Container";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { AlertCircle, Loader2 } from "lucide-react";

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("size-6 animate-spin text-primary", className)} />;
}

export function ErrorState({ message, onRetry, className }: { message: string; onRetry?: () => void; className?: string }) {
  const { t } = useI18n();
  return (
    <div className={cn("flex flex-col items-center gap-3 rounded-2xl bg-card px-6 py-12 text-center", className)}>
      <AlertCircle className="size-8 text-destructive" />
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="rounded-xl border-[1.5px] border-foreground px-4 py-2 text-sm font-bold hover:bg-muted">
          {t("Дахин оролдох")}
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

/** Account pages (profile, messages) while the session is checked: the account card beside a form card. */
export function AccountSkeleton() {
  return (
    <div className="animate-pulse" aria-hidden>
      <Container className="pt-3 md:pt-10">
        <div className="mb-6 hidden md:block">
          <div className="h-7 w-48 rounded bg-card" />
          <div className="mt-2 h-4 w-72 rounded bg-card" />
        </div>
        <div className="grid gap-3 lg:grid-cols-[300px_1fr] lg:items-start lg:gap-5">
          <div className="flex items-center gap-4 rounded-2xl bg-card p-5">
            <div className="size-14 shrink-0 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-2/3 rounded bg-muted" />
              <div className="h-3 w-1/2 rounded bg-muted" />
            </div>
          </div>
          <div className="max-w-2xl space-y-4 rounded-2xl bg-card p-5 md:p-6">
            <div className="h-5 w-40 rounded bg-muted" />
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="h-12 rounded-xl bg-muted" />
            ))}
            <div className="h-12 w-32 rounded-xl bg-muted" />
          </div>
        </div>
      </Container>
    </div>
  );
}

/** Content pages (help) before they render: the desktop banner, then a few text cards. */
export function PageSkeleton() {
  return (
    <div className="animate-pulse" aria-hidden>
      <div className="hidden h-[184px] bg-muted md:block" />
      <Container className="space-y-4 pt-4 md:pt-10">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="space-y-3 rounded-2xl bg-card p-5 md:p-6">
            <div className="h-5 w-1/3 rounded bg-muted" />
            <div className="h-3.5 w-full rounded bg-muted" />
            <div className="h-3.5 w-4/5 rounded bg-muted" />
          </div>
        ))}
      </Container>
    </div>
  );
}

/** Rows of a car picker / dealer menu: car thumb or round avatar, two lines. */
export function RowsSkeleton({ count = 5, thumb = "car", className }: { count?: number; thumb?: "car" | "avatar"; className?: string }) {
  return (
    <div className={cn("animate-pulse", className)} aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={cn("flex items-center gap-3", thumb === "car" ? "p-2" : "px-4 py-2.5")}>
          <div className={cn("shrink-0 bg-muted", thumb === "car" ? "h-14 w-20 rounded-lg" : "size-10 rounded-full")} />
          <div className="min-w-0 flex-1 space-y-2">
            <div className={cn("h-3.5 rounded bg-muted", ["w-3/5", "w-1/2", "w-2/3"][i % 3])} />
            <div className="h-3 w-1/3 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Placeholder tiles for the brand / dealer logo rows while they load. */
export function TileRowSkeleton({ count = 10 }: { count?: number }) {
  return Array.from({ length: count }, (_, i) => (
    <div key={i} className="size-16 shrink-0 animate-pulse rounded-xl bg-card md:size-[72px]">
      <div className="m-3 h-[calc(100%-1.5rem)] rounded-md bg-muted" />
    </div>
  ));
}

/** Grey placeholder grid shown while car lists load. */
export function CardGridSkeleton({ count = 6, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {Array.from({ length: count }, (_, i) => (
        // Same shape as CarCard: a compact row on phones, the tall card from sm up.
        <div key={i} className="flex animate-pulse gap-3 rounded-2xl bg-card p-2.5 sm:flex-col sm:gap-0 sm:p-3">
          <div className="aspect-[4/3] w-[42%] max-w-44 shrink-0 self-start rounded-xl bg-muted sm:w-auto sm:max-w-none" />
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="h-4 w-3/4 rounded bg-muted sm:mt-4 sm:w-2/3" />
            <div className="mt-2 h-3.5 w-1/3 rounded bg-muted sm:hidden" />
            <div className="mt-2 h-3 w-1/2 rounded bg-muted sm:hidden" />
            <div className="mt-3 hidden h-10 rounded-xl bg-muted sm:block" />
            <div className="mt-auto flex gap-2 pt-2 sm:mt-4 sm:pt-0">
              <div className="size-9 rounded-xl bg-muted sm:hidden" />
              <div className="size-9 rounded-xl bg-muted sm:hidden" />
              <div className="size-9 rounded-xl bg-muted sm:hidden" />
              <div className="hidden h-10 flex-1 rounded-xl bg-muted sm:block" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
