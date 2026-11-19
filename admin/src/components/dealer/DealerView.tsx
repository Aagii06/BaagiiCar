"use client";

import { DealerAvatar } from "@/components/car/DealerPicker";
import { errorMessage, useToast } from "@/components/common/Toast";
import { dealerList, updateDealer, type DealerListField } from "@/lib/api/admin";
import type { Dealer } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { useState } from "react";
import DealerListSection from "./DealerListSection";
import DealerListSheet from "./DealerListSheet";
import { DEALER_LIST_FIELDS } from "./dealerLists";
import { tr } from "@/lib/i18n/translations";

type DealerLists = Record<DealerListField, string[]>;

/**
 * Dealer details. Name / logo / status / description are edited behind the header's pencil (`?edit=1`);
 * phones, emails and addresses are added right here in a modal that saves at once.
 */
export default function DealerView({ dealer, onChanged, wallet }: { dealer: Dealer; onChanged?: () => void; /** Shown right under the name card (as in the app). */ wallet?: React.ReactNode }) {
  const toast = useToast();
  const active = dealer.status === "active";
  const [lists, setLists] = useState<DealerLists>(() => ({
    phonenumbers: dealerList(dealer, "phonenumbers"),
    emails: dealerList(dealer, "emails"),
    addresses: dealerList(dealer, "addresses"),
  }));
  const [editing, setEditing] = useState<DealerListField | null>(null);

  /** Saves the whole dealer with one list replaced; a thrown error stays in the modal. */
  const saveList = async (field: DealerListField, items: string[]) => {
    const next = { ...lists, [field]: items };
    await updateDealer(dealer.id, {
      name: dealer.name,
      logo: dealer.logo,
      description: dealer.description,
      status: dealer.status === "inactive" ? "inactive" : "active",
      ...next,
    });
    setLists(next);
    setEditing(null);
    toast(tr("Хадгаллаа"));
    onChanged?.();
  };

  /** Picks a row as the main one by moving it to the top. */
  const makeMain = async (field: DealerListField, index: number) => {
    const items = lists[field];
    try {
      await saveList(field, [items[index], ...items.filter((_, i) => i !== index)]);
    } catch (err) {
      toast(errorMessage(err), "error");
    }
  };
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

      {wallet}

      {DEALER_LIST_FIELDS.map((field) => (
        <DealerListSection key={field} field={field} items={lists[field]} onEdit={() => setEditing(field)} onMakeMain={(i) => makeMain(field, i)} />
      ))}
      {editing && <DealerListSheet field={editing} items={lists[editing]} onSave={(items) => saveList(editing, items)} onClose={() => setEditing(null)} />}
    </div>
  );
}
