import { cn } from "@/lib/utils";

export const BRAND = "Cardealer";

/** Logo artwork in a white tile, so its black strokes stay visible on any background. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span className={cn("grid size-9 place-items-center overflow-hidden rounded-[10px] bg-white", className)} aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element -- static logo */}
      <img src="/logo.png" alt="" className="w-[86%]" />
    </span>
  );
}

/** Car-and-handshake logo + "Cardealer" wordmark. */
export default function Logo({ dark, className }: { dark?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)} aria-label={BRAND}>
      {/* On dark backgrounds the black strokes need a white chip behind them. */}
      <span className={cn("inline-flex shrink-0", dark && "rounded-[10px] bg-white px-1.5 py-1")} aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element -- static logo */}
        <img src="/logo.png" alt="" className="h-9 w-auto" />
      </span>
      <span className={cn("font-display text-[22px] font-bold tracking-wide", dark ? "text-white" : "text-foreground")}>Cardealer</span>
    </span>
  );
}
