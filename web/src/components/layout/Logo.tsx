import { cn } from "@/lib/utils";

export const BRAND = "Cardealer";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span className={cn("grid size-9 place-items-center rounded-[10px] bg-primary text-white", className)} aria-hidden>
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 14.5v-2l2-1 2.5-3.5h8l3 3.5 2.5.5v2.5h-1.5M6.5 14.5h9" />
        <circle cx="7.5" cy="15" r="1.6" fill="currentColor" />
        <circle cx="17" cy="15" r="1.6" fill="currentColor" />
      </svg>
    </span>
  );
}

/** Orange mark + "Cardealer" wordmark. */
export default function Logo({ dark, className }: { dark?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)} aria-label={BRAND}>
      <LogoMark />
      <span className={cn("font-display text-[22px] font-bold tracking-wide", dark ? "text-white" : "text-foreground")}>Cardealer</span>
    </span>
  );
}
