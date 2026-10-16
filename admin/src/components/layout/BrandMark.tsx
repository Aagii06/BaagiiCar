export default function BrandMark() {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="grid size-8 place-items-center rounded-[9px] bg-primary text-white" aria-hidden>
        <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 14.5v-2l2-1 2.5-3.5h8l3 3.5 2.5.5v2.5h-1.5M6.5 14.5h9" />
          <circle cx="7.5" cy="15" r="1.6" fill="currentColor" />
          <circle cx="17" cy="15" r="1.6" fill="currentColor" />
        </svg>
      </span>
      <span className="whitespace-nowrap font-display text-base font-semibold tracking-tight">Baagii Car Dealer</span>
      <span className="rounded-md bg-dark px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">Admin</span>
    </span>
  );
}
