import type { ImgHTMLAttributes } from "react";

/** "No image" picture: our logo in gray, cut three ways (public/no-image*.png). */
export const NO_IMAGE = "/no-image.png";

/** Small boxes get the tight cut (the logo fills it), wide ones the 4:3 cut, the rest the square one. */
export function noImageFor(width: number, height: number) {
  if (Math.max(width, height) <= 96) return "/no-image-sm.png";
  if (height && width / height >= 1.2) return "/no-image-wide.png";
  return NO_IMAGE;
}

// Picks the cut once the box is laid out (its size comes from the classes, not the picture).
const fit = (el: HTMLImageElement | null) => {
  if (!el) return;
  const src = noImageFor(el.clientWidth, el.clientHeight);
  if (!el.src.endsWith(src)) el.src = src;
};

/** Shown instead of an image that is not uploaded, has an empty path, or fails to load. */
export default function NoImage({ alt = "", ...props }: Omit<ImgHTMLAttributes<HTMLImageElement>, "src">) {
  // A caller's srcSet / sizes belong to the real picture and would override this one.
  // eslint-disable-next-line @next/next/no-img-element -- static default picture
  return <img alt={alt} {...props} src={NO_IMAGE} srcSet={undefined} sizes={undefined} ref={fit} />;
}
