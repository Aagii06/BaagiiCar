"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";
import { cn } from "@/lib/utils";

export default function Container({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-[1280px] px-4 md:px-10", className)}>{children}</div>;
}

/** Page heading; hidden on phones, where the app bar already shows the title. */
export function PageTitle({ children, count, className }: { children: React.ReactNode; count?: number; className?: string }) {
  return (
    <h1 className={cn("flex flex-wrap items-center gap-3 max-md:hidden font-display text-[36px] font-bold leading-none md:text-[56px]", className)}>
      {children}
      {count !== undefined && (
        <span className="rounded-lg bg-primary px-2.5 py-1.5 font-sans text-base font-bold normal-case tracking-normal text-white md:text-lg">{count}</span>
      )}
    </h1>
  );
}

/** Smaller heading for the account pages (profile, saved, messages); hidden on phones like PageTitle. */
export function AccountTitle({ title, subtitle, aside }: { title: string; subtitle?: string; aside?: React.ReactNode }) {
  return (
    <div className="mb-6 hidden items-end justify-between gap-4 md:flex">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {aside && <span className="text-sm text-muted-foreground">{aside}</span>}
    </div>
  );
}

/**
 * Reference-style section heading: spaced kicker, then a light word and a
 * bold word ("ОНЦЛОХ / зарууд"), with an optional "view all" link.
 */
export function SectionTitle({
  kicker,
  light,
  bold,
  action,
  className,
}: {
  kicker?: string;
  light?: string;
  bold: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-end justify-between gap-4", className)}>
      <div>
        {kicker && <p className="kicker">{kicker}</p>}
        <h2 className={cn(kicker && "mt-2", "font-display text-[24px] leading-none md:text-[40px]")}>
          {light && <span className="font-light">{light} </span>}
          <span className="font-bold">{bold}</span>
        </h2>
      </div>
      {action}
    </div>
  );
}

export function ViewAll({ href, label }: { href: string; label?: string }) {
  const { t } = useI18n();
  return (
    <a href={href} className="group flex shrink-0 items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] hover:text-primary">
      {label ?? t("Бүгдийг харах")}
      <span className="transition-transform group-hover:translate-x-0.5">→</span>
    </a>
  );
}
