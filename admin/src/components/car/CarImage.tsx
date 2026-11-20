"use client";

import NoImage from "@/components/common/NoImage";
import { originalImage, uploadUrl, type ImageSize } from "@/lib/api/config";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

/**
 * A car's photo: a pulsing skeleton while it loads, then the photo fades in.
 * The default "no image" picture shows when there is none or it fails to load.
 * A resized cut (`size`) that's missing on the server is retried as the original file.
 */
export default function CarImage({
  image,
  size = "grid",
  className,
  alt = "",
}: {
  id?: number;
  image: string | null | undefined;
  /** Kept for callers; the default picture does not vary by body type. */
  bodyType?: string | null;
  /** thumb for small list pictures, grid for cards, full only for a large view. */
  size?: ImageSize;
  className?: string;
  /** Kept for callers (sized the old line-art fallback). */
  artClassName?: string;
  alt?: string;
}) {
  const wanted = uploadUrl(image, size);
  const original = originalImage(wanted);
  const ref = useRef<HTMLImageElement>(null);
  // Which URL finished / which failed, so a new image starts over on the skeleton.
  const [loaded, setLoaded] = useState<string | null>(null);
  const [failed, setFailed] = useState<string[]>([]);
  const src = wanted && !failed.includes(wanted) ? wanted : original && !failed.includes(original) ? original : null;

  // Cached photos can finish before hydration attaches onLoad.
  useEffect(() => {
    const el = ref.current;
    if (src && el?.complete && el.naturalWidth) setLoaded(src);
  }, [src]);

  return (
    <div className={cn("relative overflow-hidden rounded-xl bg-white", className)}>
      {!src ? (
        // No photo, or it failed to load.
        <NoImage aria-hidden className="absolute inset-0 size-full object-contain" />
      ) : (
        <>
          {loaded !== src && <div aria-hidden className="absolute inset-0 animate-pulse bg-foreground/10" />}
          {/* eslint-disable-next-line @next/next/no-img-element -- backend-served uploads, any host */}
          <img
            ref={ref}
            key={src}
            src={src}
            alt={alt}
            loading="lazy"
            onLoad={() => setLoaded(src)}
            onError={() => setFailed((f) => [...f, src])}
            className={cn("absolute inset-0 size-full object-cover transition-opacity duration-300", loaded === src ? "opacity-100" : "opacity-0")}
          />
        </>
      )}
    </div>
  );
}
