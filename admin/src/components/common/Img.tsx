"use client";

import { originalImage } from "@/lib/api/config";
import { cn } from "@/lib/utils";
import NoImage from "@/components/common/NoImage";
import { useEffect, useRef, useState } from "react";

/**
 * `<img>` that pulses as a skeleton until it has loaded, then fades in.
 * The skeleton is the element's own background, so it takes the image's box:
 * give the image a size, or `placeholderClassName` one for while it loads
 * (images sized only by max-width/height are 0×0 until they arrive).
 * `skeletonClassName` swaps the default color, e.g. for dark backgrounds.
 * A resized cut (`thumb_` / `grid_` / `icon_`) that fails to load is retried as the original file
 * (SVGs and older uploads have no cuts).
 * No src (not uploaded / empty path) or a file that fails to load shows the "no image" picture instead,
 * or `fallback` when given.
 */
export default function Img({
  src: wanted,
  className,
  skeletonClassName = "bg-foreground/10",
  placeholderClassName,
  onLoad,
  onError,
  alt = "",
  fallback,
  ...props
}: Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string | null | undefined;
  skeletonClassName?: string;
  placeholderClassName?: string;
  /** Shown instead of the "no image" picture when there is no src or it fails to load. */
  fallback?: React.ReactNode;
}) {
  const ref = useRef<HTMLImageElement>(null);
  // URLs that failed, so a new src gets its own try.
  const [failed, setFailed] = useState<string[]>([]);
  const original = originalImage(wanted);
  const src = wanted && !failed.includes(wanted) ? wanted : original && !failed.includes(original) ? original : null;
  const missing = !src;
  // Tracks which src finished, so switching src shows the skeleton again.
  const [doneSrc, setDoneSrc] = useState<string | null>(null);
  const loading = !missing && doneSrc !== src;

  // Cached images can finish before hydration attaches onLoad.
  useEffect(() => {
    const el = ref.current;
    if (src && el?.complete && el.naturalWidth) setDoneSrc(src);
  }, [src]);

  if (missing && fallback !== undefined) return <>{fallback}</>;
  if (missing) return <NoImage alt={alt} className={className} {...props} />;

  return (
    // eslint-disable-next-line @next/next/no-img-element -- backend-served uploads, any host
    <img
      ref={ref}
      key={src}
      src={src}
      alt={alt}
      onLoad={(e) => {
        setDoneSrc(src);
        onLoad?.(e);
      }}
      onError={(e) => {
        setFailed((f) => [...f, src]);
        // Callers hear about it only once the original has failed too.
        if (src !== wanted || !original) onError?.(e);
      }}
      className={cn("transition-opacity duration-300", className, loading && ["animate-pulse text-transparent", skeletonClassName, placeholderClassName])}
      {...props}
    />
  );
}
