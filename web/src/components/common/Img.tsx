"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

/**
 * `<img>` that pulses as a skeleton until it has loaded, then fades in.
 * The skeleton is the element's own background, so it takes the image's box:
 * give the image a size, or `placeholderClassName` one for while it loads
 * (images sized only by max-width/height are 0×0 until they arrive).
 * `skeletonClassName` swaps the default color, e.g. for dark backgrounds.
 */
export default function Img({
  src,
  className,
  skeletonClassName = "bg-foreground/10",
  placeholderClassName,
  onLoad,
  onError,
  alt = "",
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement> & { src: string; skeletonClassName?: string; placeholderClassName?: string }) {
  const ref = useRef<HTMLImageElement>(null);
  // Tracks which src finished, so switching src shows the skeleton again.
  const [doneSrc, setDoneSrc] = useState<string | null>(null);
  const loading = doneSrc !== src;

  // Cached images can finish before hydration attaches onLoad.
  useEffect(() => {
    const el = ref.current;
    if (el?.complete && el.naturalWidth) setDoneSrc(src);
  }, [src]);

  return (
    // eslint-disable-next-line @next/next/no-img-element -- backend-served uploads, any host
    <img
      ref={ref}
      src={src}
      alt={alt}
      onLoad={(e) => {
        setDoneSrc(src);
        onLoad?.(e);
      }}
      onError={(e) => {
        setDoneSrc(src);
        onError?.(e);
      }}
      className={cn("transition-opacity duration-300", className, loading && ["animate-pulse text-transparent", skeletonClassName, placeholderClassName])}
      {...props}
    />
  );
}
