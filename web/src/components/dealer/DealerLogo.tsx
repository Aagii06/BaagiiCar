import DealerAvatar from "@/components/common/DealerAvatar";
import { dealerName, type Dealer } from "@/lib/api/dealers";
import { cn } from "@/lib/utils";

/** Dealer logo in a rounded tile; size and background come from `className`. */
export default function DealerLogo({ dealer, className }: { dealer: Dealer; className?: string }) {
  return (
    <div className={cn("grid shrink-0 place-items-center overflow-hidden rounded-xl bg-muted", className)}>
      <DealerAvatar logo={dealer.logo} name={dealerName(dealer)} className="size-full object-contain" />
    </div>
  );
}
