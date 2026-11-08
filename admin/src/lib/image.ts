import { tr } from "@/lib/i18n/translations";

/** Largest image the backend takes (formidable maxFileSize); it then shrinks it. */
export const MAX_IMAGE_MB = 50;

/** The error to show for a picked image over `MAX_IMAGE_MB`, or `null` if it's fine. */
export function imageSizeError(file: File): string | null {
  if (file.size <= MAX_IMAGE_MB * 1024 * 1024) return null;
  return tr("«{name}» зураг {size}MB байна. {max}MB хүртэлх зураг сонгоно уу.", {
    name: file.name,
    size: (file.size / 1024 / 1024).toFixed(1),
    max: MAX_IMAGE_MB,
  });
}
