import Img from "@/components/common/Img";
import { uploadUrl } from "@/lib/api/config";

/** Dealer logo, or the "no image" picture when there is no logo or it fails to load. */
export default function DealerAvatar({
  logo,
  ...props
}: {
  /** File name in `uploads/dealers`. */
  logo: string | null | undefined;
  className?: string;
  skeletonClassName?: string;
} & Pick<React.ImgHTMLAttributes<HTMLImageElement>, "loading" | "fetchPriority">) {
  return <Img src={uploadUrl(logo, "full", "dealers")} {...props} />;
}
