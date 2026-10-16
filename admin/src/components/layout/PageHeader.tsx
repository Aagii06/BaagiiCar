import { ChevronLeft } from "lucide-react";
import Link from "next/link";

/** Title block at the top of a tab page; `children` holds search / filters. */
export default function PageHeader({ title, aside, children }: { title: string; aside?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="-mx-4 mb-4 space-y-4 border-b border-border bg-white px-4 pb-4 pt-5">
      <div className="flex min-h-10 items-center justify-between gap-3">
        <h1 className="min-w-0 truncate font-display text-[22px] font-bold tracking-tight">{title}</h1>
        {aside}
      </div>
      {children}
    </div>
  );
}

/** Back-button header for pages below a tab. */
export function DetailHeader({ title, back, aside }: { title: string; back: string; aside?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-30 -mx-4 mb-4 flex items-center gap-2 border-b border-border bg-white/95 px-2 py-2 backdrop-blur">
      <Link href={back} aria-label="Буцах" className="grid size-10 place-items-center rounded-xl hover:bg-muted">
        <ChevronLeft className="size-5" />
      </Link>
      <h1 className="min-w-0 flex-1 truncate text-base font-bold">{title}</h1>
      {aside}
    </header>
  );
}
