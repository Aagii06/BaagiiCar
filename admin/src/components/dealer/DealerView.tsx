import { DealerAvatar } from "@/components/car/DealerPicker";
import { dealerList } from "@/lib/api/admin";
import type { Dealer } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";
import { DEALER_LIST_FIELDS, DEALER_LISTS } from "./dealerLists";
import MainBadge from "./MainBadge";
import { tr } from "@/lib/i18n/translations";

/** Read-only dealer details; editing is behind the header's pencil (`?edit=1`). */
export default function DealerView({ dealer }: { dealer: Dealer }) {
  const active = dealer.status === "active";
  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-card p-4">
        <div className="flex items-center gap-3">
          <DealerAvatar dealer={dealer} className="size-16" />
          <div className="min-w-0 flex-1">
            <h2 className="break-words text-lg font-bold">{dealer.name}</h2>
            <span className={cn("mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold", active ? "bg-success-soft text-success" : "bg-destructive-soft text-destructive")}>
              {active ? tr("Идэвхтэй") : tr("Идэвхгүй")}
            </span>
          </div>
        </div>
        {dealer.description && (
          <div className="mt-4">
            <p className="text-xs font-medium text-muted-foreground">{tr("Тайлбар")}</p>
            <p className="mt-1 whitespace-pre-line text-sm leading-relaxed">{dealer.description}</p>
          </div>
        )}
      </section>

      {DEALER_LIST_FIELDS.map((field) => {
        const cfg = DEALER_LISTS[field];
        const items = dealerList(dealer, field);
        const several = items.length > 1;
        return (
          <section key={field} className="rounded-2xl bg-card p-4">
            <h2 className="mb-3 text-lg font-bold">{cfg.title}</h2>
            {items.length ? (
              <ul className="space-y-1">
                {items.map((v, i) => {
                  const main = several && i === 0;
                  return (
                    <li key={v} className={cn("flex items-center gap-2 rounded-xl px-3 py-2.5", main ? "bg-primary-soft text-primary" : "bg-muted/50")}>
                      {main && <Star className="size-4 shrink-0 fill-current" />}
                      {field === "phonenumbers" ? (
                        <a href={`tel:${v}`} className={cn("min-w-0 flex-1 break-words", main ? "font-bold" : "font-medium text-foreground/80")}>{v}</a>
                      ) : field === "emails" ? (
                        <a href={`mailto:${v}`} className={cn("min-w-0 flex-1 break-words", main ? "font-bold" : "font-medium text-foreground/80")}>{v}</a>
                      ) : (
                        <span className={cn("min-w-0 flex-1 break-words", main ? "font-bold" : "font-medium text-foreground/80")}>{v}</span>
                      )}
                      {main && <MainBadge />}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">{cfg.empty}</p>
            )}
          </section>
        );
      })}
    </div>
  );
}
