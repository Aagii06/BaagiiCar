"use client";

import Img from "@/components/common/Img";
import { uploadUrl } from "@/lib/api/config";
import { useState } from "react";

/**
 * Dealer logo, or the name's first letter when there is no logo or it fails to load.
 * Renders only the image / letter; the caller's wrapper gives the box.
 */
export default function DealerAvatar({
  logo,
  name,
  imgClassName,
  letterClassName,
  ...props
}: {
  /** File name in `uploads/dealers`. */
  logo: string | null | undefined;
  name: string | null | undefined;
  imgClassName?: string;
  letterClassName?: string;
} & Pick<React.ImgHTMLAttributes<HTMLImageElement>, "loading" | "fetchPriority">) {
  const src = uploadUrl(logo, "full", "dealers");
  // The src that failed, so a new logo gets its own try.
  const [failed, setFailed] = useState<string | null>(null);

  if (src && failed !== src) return <Img src={src} onError={() => setFailed(src)} className={imgClassName} {...props} />;
  return (
    <span aria-hidden className={letterClassName}>
      {name?.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}
