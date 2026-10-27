export default function BrandMark({ dark }: { dark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2" aria-label="Cardealer Admin">
      {/* On dark backgrounds the logo's black strokes need a white chip behind them. */}
      <span className={`inline-flex shrink-0 ${dark ? "rounded-[9px] bg-white px-1 py-0.5" : ""}`} aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element -- static logo */}
        <img src="/logo.png" alt="" className="h-8 w-auto" />
      </span>
      <span className={`font-display text-lg font-bold tracking-wide ${dark ? "text-white" : "text-foreground"}`}>Cardealer</span>
      <span className="rounded-md bg-primary-soft px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">Admin</span>
    </span>
  );
}
