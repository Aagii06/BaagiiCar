"use client";

import NoImage from "@/components/common/NoImage";
import { useState, type ImgHTMLAttributes, type ReactNode } from "react";

/**
 * An uploaded image that shows `fallback` when there is no src or the file
 * fails to load (deleted / missing on the server), instead of a broken icon.
 * `fallback` defaults to the "no image" picture (our logo in gray) with the same classes.
 */
export default function Img({
  src,
  fallback,
  alt = "",
  ...props
}: Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & { src: string | null | undefined; fallback?: ReactNode }) {
  // Which src failed, so a new src gets a fresh try.
  const [failed, setFailed] = useState<string | null>(null);

  if (!src || failed === src) {
    return fallback ?? <NoImage {...props} alt={alt} />;
  }
  // eslint-disable-next-line @next/next/no-img-element -- backend-served uploads, any host
  return <img {...props} src={src} alt={alt} onError={() => setFailed(src)} />;
}
