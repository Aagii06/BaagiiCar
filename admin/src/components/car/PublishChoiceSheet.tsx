"use client";

import { cn } from "@/lib/utils";
import { Megaphone, Star } from "lucide-react";
import { useEffect } from "react";

/** Asked when an admin publishes a new ad: featured or a normal ad. Backdrop / Escape cancels. */
export default function PublishChoiceSheet({ onChoose, onClose }: { onChoose: (featured: boolean) => void; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const option = (featured: boolean) => (
    <button
      type="button"
      autoFocus={!featured}
      onClick={() => onChoose(featured)}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border-2 p-4 text-left transition hover:border-foreground/30",
        featured ? "border-amber bg-amber-soft" : "border-border bg-white"
      )}
    >
      <span className={cn("grid size-11 shrink-0 place-items-center rounded-full", featured ? "bg-amber text-foreground" : "bg-primary-soft text-primary")}>
        {featured ? <Star className="size-5 fill-current" /> : <Megaphone className="size-5" />}
      </span>
      <span className="min-w-0">
        <span className="block font-bold">{featured ? "Онцлох зар" : "Энгийн зар"}</span>
        <span className="block text-xs text-muted-foreground">{featured ? "Нүүр хуудсанд болон хайлтын эхэнд гарна" : "Зарын жагсаалтад ердийнхөөрөө гарна"}</span>
      </span>
    </button>
  );

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 animate-fade-in bg-dark/50 backdrop-blur-[2px]" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="publish-choice-title"
        className="absolute inset-x-0 bottom-0 mx-auto max-w-md animate-sheet-up rounded-t-3xl bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
        <h2 id="publish-choice-title" className="text-center text-lg font-bold">
          Зарыг хэрхэн нийтлэх вэ?
        </h2>
        <div className="mt-4 space-y-2">
          {option(false)}
          {option(true)}
        </div>
        <button type="button" onClick={onClose} className="mt-3 h-12 w-full rounded-xl bg-muted font-bold hover:bg-border">
          Болих
        </button>
      </div>
    </div>
  );
}
