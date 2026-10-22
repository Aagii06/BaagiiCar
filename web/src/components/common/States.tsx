"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { AlertCircle, Loader2 } from "lucide-react";

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("size-6 animate-spin text-primary", className)} />;
}

export function LoadingState({ className }: { className?: string }) {
  return (
    <div className={cn("grid place-items-center py-20", className)}>
      <Spinner />
    </div>
  );
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
