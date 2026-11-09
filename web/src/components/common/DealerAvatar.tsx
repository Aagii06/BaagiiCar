import Img from "@/components/common/Img";
import { uploadUrl } from "@/lib/api/config";
import { cn, initials } from "@/lib/utils";

/**
 * Dealer logo; with no logo (or one that fails to load) the dealer's initials —
 * the first letters of the first two words of the name.
 */
export default function DealerAvatar({
  logo,
  name,
  className,
  ...props
}: {
  /** File name in `uploads/dealers`. */
  logo: string | null | undefined;
  /** Dealer name, for the initials fallback. */
  name: string | null | undefined;
  className?: string;
  skeletonClassName?: string;
} & Pick<React.ImgHTMLAttributes<HTMLImageElement>, "loading" | "fetchPriority">) {
  const fallback = (
    <span
      role="img"
      aria-label={name ?? undefined}
      className={cn(
        "@container grid select-none place-items-center rounded-lg",
        className,
        "bg-primary-soft font-bold text-primary opacity-100 grayscale-0"
      )}
    >
      <span className="text-[38cqw] leading-none">{initials(name, "start")}</span>
    </span>
  );
  return <Img src={uploadUrl(logo, "full", "dealers")} className={className} fallback={fallback} {...props} />;
}
