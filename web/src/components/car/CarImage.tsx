"use client";

import Img from "@/components/common/Img";
import { uploadUrl, type ImageSize } from "@/lib/api/config";
import { cn, tintFor } from "@/lib/utils";
import { useState } from "react";
import CarArt, { shapeFor } from "./CarArt";

/**
 * A car's photo in a tinted well, falling back to the design's line-art car
 * when the ad has no photo (or it fails to load).
 */
export default function CarImage({
  id,
  image,
  bodyType,
  size = "grid",
  className,
  artClassName,
  alt = "",
}: {
  id: number;
  image: string | null | undefined;
  bodyType?: string | null;
  size?: ImageSize;
  className?: string;
  artClassName?: string;
  alt?: string;
}) {
  const src = uploadUrl(image, size);
  const [failed, setFailed] = useState(false);
  const showPhoto = src && !failed;

  return (
    <div className={cn("relative grid place-items-center overflow-hidden rounded-xl", tintFor(id), className)}>
      {showPhoto ? (
        <Img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className="absolute inset-0 size-full object-cover" />
      ) : (
        <CarArt shape={shapeFor(bodyType)} className={cn("w-[62%]", artClassName)} />
      )}
    </div>
  );
}
