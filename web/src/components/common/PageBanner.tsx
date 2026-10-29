import Container from "@/components/common/Container";
import Img from "@/components/common/Img";
import { cn } from "@/lib/utils";

/**
 * Title band over a hero photo (road by default; Unsplash, see public/hero/CREDITS.md), darkened so the white text reads.
 * Phones: hidden — the app bar carries the title instead.
 */
export default function PageBanner({
  title,
  aside,
  asideLoading,
  image = "road",
  imagePosition = "object-[center_60%]",
}: {
  title: string;
  aside?: React.ReactNode;
  asideLoading?: boolean;
  /** File name in public/hero (without extension); each needs a 1920w and a -sm 900w WebP. */
  image?: string;
  imagePosition?: string;
}) {
  return (
    <section className="relative isolate hidden overflow-hidden bg-dark text-white md:block">
      <div className="absolute inset-0 -z-10">
        <Img
          src={`/hero/${image}.webp`}
          srcSet={`/hero/${image}-sm.webp 900w, /hero/${image}.webp 1920w`}
          sizes="100vw"
          alt=""
          fetchPriority="high"
          className={cn("size-full object-cover", imagePosition)}
        />
      </div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/80 via-black/55 to-black/25" />
      <Container className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-7">
        <h1 className="font-display text-2xl font-bold uppercase leading-tight tracking-tight lg:text-3xl">{title}</h1>
        {/* Total beside the title; pulses while it is loading. */}
        <span aria-live="polite" className={cn("text-sm font-medium tabular-nums text-white/75", asideLoading && "animate-pulse")}>
          {aside}
        </span>
      </Container>
    </section>
  );
}
