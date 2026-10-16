import { cn } from "@/lib/utils";

export default function Container({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-[1280px] px-4 md:px-10", className)}>{children}</div>;
}

export function PageTitle({ children, count, className }: { children: React.ReactNode; count?: number; className?: string }) {
  return (
    <h1 className={cn("flex flex-wrap items-center gap-3 font-display text-[32px] font-bold leading-none tracking-tight md:text-[56px]", className)}>
      {children}
      {count !== undefined && (
        <span className="rounded-lg bg-primary px-2.5 py-1.5 font-sans text-base font-bold tracking-normal text-white md:text-lg">{count}</span>
      )}
    </h1>
  );
}
