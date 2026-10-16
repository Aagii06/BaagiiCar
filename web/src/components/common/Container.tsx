import { cn } from "@/lib/utils";

export default function Container({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-[1280px] px-4 md:px-10", className)}>{children}</div>;
}

export function PageTitle({ children, count, className }: { children: React.ReactNode; count?: number; className?: string }) {
  return (
    <h1 className={cn("flex flex-wrap items-center gap-3 font-display text-[36px] font-bold leading-none md:text-[56px]", className)}>
      {children}
      {count !== undefined && (
        <span className="rounded-lg bg-primary px-2.5 py-1.5 font-sans text-base font-bold normal-case tracking-normal text-white md:text-lg">{count}</span>
      )}
    </h1>
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
  kicker: string;
  light?: string;
  bold: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-end justify-between gap-4", className)}>
      <div>
        <p className="kicker">{kicker}</p>
        <h2 className="mt-2 font-display text-[30px] leading-none md:text-[40px]">
          {light && <span className="font-light">{light} </span>}
          <span className="font-bold">{bold}</span>
        </h2>
      </div>
      {action}
    </div>
  );
}

export function ViewAll({ href, label = "Бүгдийг харах" }: { href: string; label?: string }) {
  return (
    <a href={href} className="group flex shrink-0 items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] hover:text-primary">
      {label}
      <span className="transition-transform group-hover:translate-x-0.5">→</span>
    </a>
  );
}
