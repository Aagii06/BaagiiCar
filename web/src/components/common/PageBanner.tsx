import Container from "@/components/common/Container";
import Img from "@/components/common/Img";
import { cn } from "@/lib/utils";

/**
 * Title band over a road photo (Unsplash, see public/hero/CREDITS.md), darkened so the white text reads.
 * Phones: hidden — the app bar carries the title instead.
 */
export default function PageBanner({ title, aside, asideLoading }: { title: string; aside?: React.ReactNode; asideLoading?: boolean }) {
  return (
    <section className="relative isolate hidden overflow-hidden bg-dark text-white md:block">
      <div className="absolute inset-0 -z-10">
        <Img
          src="/hero/road.webp"
          srcSet="/hero/road-sm.webp 900w, /hero/road.webp 1920w"
          sizes="100vw"
          alt=""
          fetchPriority="high"
          className="size-full object-cover object-[center_60%]"
        />
      </div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/80 via-black/55 to-black/25" />
      <Container className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-10 md:py-16">
        <h1 className="font-display text-3xl font-bold uppercase leading-tight tracking-tight md:text-5xl">{title}</h1>
        {/* Total beside the title; pulses while it is loading. */}
        <span aria-live="polite" className={cn("text-sm font-medium tabular-nums text-white/75 md:text-base", asideLoading && "animate-pulse")}>
          {aside}
        </span>
      </Container>
    </section>
  );
}
