"use client";

import { DealerAvatar } from "@/components/car/DealerPicker";
import { errorMessage, useToast } from "@/components/common/Toast";
import { dealerList, updateDealer, type DealerListField } from "@/lib/api/admin";
import type { Dealer } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { Mail, MapPin, Phone } from "lucide-react";
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
  // Only the main (first) phone, email and address go on the name card.
  const phone = lists.phonenumbers[0];
  const email = lists.emails[0];
  const address = lists.addresses[0];

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
      {/* Name card: dark, so the orange balance card under it stands out. */}
      <section className="relative overflow-hidden rounded-2xl bg-linear-to-br from-dark via-dark-2 to-dark p-5 text-white shadow-lg shadow-dark/20">
        {/* Soft glows, purely decorative. */}
        <div aria-hidden className="pointer-events-none absolute -right-10 -top-12 size-44 rounded-full bg-primary/35 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-16 -left-10 size-40 rounded-full bg-orange-400/15 blur-3xl" />

        <div className="relative flex items-center gap-4">
          <div className="shrink-0 rounded-2xl bg-white/10 p-1 ring-1 ring-white/15">
            <DealerAvatar dealer={dealer} className="size-20 rounded-xl! border-0!" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="wrap-break-word font-display text-xl font-bold leading-tight md:text-2xl">{dealer.name}</h2>
            <span
              className={cn(
                "mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold",
                active ? "bg-success/20 text-emerald-300" : "bg-destructive/20 text-red-300"
              )}
            >
              <span className={cn("size-1.5 rounded-full", active ? "bg-emerald-400" : "bg-red-400")} />
              {active ? tr("Идэвхтэй") : tr("Идэвхгүй")}
            </span>
          </div>
        </div>

        {(phone || email || address) && (
          <div className="relative mt-4 flex flex-wrap gap-2 text-sm">
            {phone && (
              <a href={`tel:${phone}`} className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 font-semibold hover:bg-white/15">
                <Phone className="size-4 text-primary" />
                {phone}
              </a>
            )}
            {email && (
              <a href={`mailto:${email}`} className="flex min-w-0 max-w-full items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 font-semibold hover:bg-white/15">
                <Mail className="size-4 shrink-0 text-primary" />
                <span className="truncate">{email}</span>
              </a>
            )}
            {address && (
              <span className="flex min-w-0 max-w-full items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 font-medium">
                <MapPin className="size-4 shrink-0 text-primary" />
                <span className="truncate">{address}</span>
              </span>
            )}
          </div>
        )}

        {dealer.description && <p className="relative mt-4 whitespace-pre-line border-t border-white/10 pt-3 text-sm leading-relaxed text-white/75">{dealer.description}</p>}
      </section>

      {wallet}

      {DEALER_LIST_FIELDS.map((field) => (
        <DealerListSection key={field} field={field} items={lists[field]} onEdit={() => setEditing(field)} onMakeMain={(i) => makeMain(field, i)} />
      ))}
      {editing && <DealerListSheet field={editing} items={lists[editing]} onSave={(items) => saveList(editing, items)} onClose={() => setEditing(null)} />}
    </div>
  );
}
