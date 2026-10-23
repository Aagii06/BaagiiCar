"use client";

import { uploadUrl, type ImageSize } from "@/lib/api/config";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

/** Shown when the ad has no photo, while it loads (however slowly), and if it fails — same as the website. */
export const DEFAULT_CAR_IMAGE = "/no-car.png";

/**
 * A car's photo over the default "image coming soon" picture: the photo fades in
 * once it has loaded, and the default stays when there is none or it fails.
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
  size?: ImageSize;
  className?: string;
  /** Kept for callers (sized the old line-art fallback). */
  artClassName?: string;
  alt?: string;
}) {
  const src = uploadUrl(image, size);
  const ref = useRef<HTMLImageElement>(null);
  // Which src finished / failed, so a new src starts over on the default.
  const [loaded, setLoaded] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);

  // Cached photos can finish before hydration attaches onLoad.
  useEffect(() => {
    const el = ref.current;
    if (src && el?.complete && el.naturalWidth) setLoaded(src);
  }, [src]);

  return (
    <div className={cn("relative overflow-hidden rounded-xl bg-white", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- static default picture */}
      <img src={DEFAULT_CAR_IMAGE} alt="" aria-hidden className="absolute inset-0 size-full object-cover" />
      {src && failed !== src && (
        // eslint-disable-next-line @next/next/no-img-element -- backend-served uploads, any host
        <img
          ref={ref}
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(src)}
          onError={() => setFailed(src)}
          className={cn("absolute inset-0 size-full object-cover transition-opacity duration-300", loaded === src ? "opacity-100" : "opacity-0")}
        />
      )}
    </div>
  );
}
