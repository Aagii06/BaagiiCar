"use client";

import { FormError } from "@/components/common/Field";
import { errorMessage, useToast } from "@/components/common/Toast";
import { createDealer, dealerList, updateDealer, type DealerInput, type DealerListField } from "@/lib/api/admin";
import type { Dealer } from "@/lib/api/types";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DealerActions from "./DealerActions";
import DealerInfoSection, { type DealerInfo } from "./DealerInfoSection";
import DealerListSection from "./DealerListSection";
import DealerListSheet from "./DealerListSheet";
import { DEALER_LIST_FIELDS, DEALER_LISTS } from "./dealerLists";

/** Lets the header's save icon submit the form via `form={DEALER_FORM_ID}`. */
export const DEALER_FORM_ID = "dealer-form";

type DealerLists = Record<DealerListField, string[]>;

/** Create / edit a dealer. `listHref`: the list to return to after save / delete (keeps `?from=`). */
export default function DealerForm({ dealer, listHref, onBusyChange }: { dealer: Dealer | null; listHref: string; onBusyChange: (busy: boolean) => void }) {
  const router = useRouter();
  const toast = useToast();
  const [info, setInfo] = useState<DealerInfo>({
    name: dealer?.name ?? "",
    logo: dealer?.logo ?? "",
    description: dealer?.description ?? "",
    status: dealer?.status === "inactive" ? "inactive" : "active",
  });
  // Phones, emails and addresses are edited in a modal (DealerListSheet); the first of each is the main one
  // (the first added, until another is picked on the form).
  const [lists, setLists] = useState<DealerLists>(() => ({
    phonenumbers: dealerList(dealer, "phonenumbers"),
    emails: dealerList(dealer, "emails"),
    addresses: dealerList(dealer, "addresses"),
  }));
  const [editing, setEditing] = useState<DealerListField | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => onBusyChange(busy), [busy, onBusyChange]);

  const bodyOf = (l: DealerLists): DealerInput => ({
    name: info.name.trim(),
    logo: info.logo || null,
    ...l,
    description: info.description.trim() || null,
    status: info.status,
  });

  /** The modal's save: an existing dealer is saved right away, a new one keeps it until "Бүртгэх". */
  const saveList = async (field: DealerListField, items: string[]) => {
    const next = { ...lists, [field]: items };
    if (dealer) {
      if (!info.name.trim()) throw new Error("Дилерийн нэр оруулна уу");
      await updateDealer(dealer.id, bodyOf(next));
      toast("Хадгаллаа");
    }
    setLists(next);
    setEditing(null);
  };

  /** Picks a row as the main one by moving it to the top; the rest keep their order. */
  const makeMain = async (field: DealerListField, index: number) => {
    const items = lists[field];
    try {
      await saveList(field, [items[index], ...items.filter((_, i) => i !== index)]);
    } catch (err) {
      toast(errorMessage(err), "error");
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!info.name.trim()) return setError("Дилерийн нэр оруулна уу");
    for (const field of DEALER_LIST_FIELDS) {
      const problem = DEALER_LISTS[field].check(lists[field]);
      if (problem) return setError(problem);
    }
    setBusy(true);
    setError(null);
    try {
      if (dealer) await updateDealer(dealer.id, bodyOf(lists));
      else await createDealer(bodyOf(lists));
      toast("Хадгаллаа");
      router.push(listHref);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <form id={DEALER_FORM_ID} onSubmit={submit} className="space-y-4">
      <DealerInfoSection value={info} onChange={setInfo} />
      {DEALER_LIST_FIELDS.map((field) => (
        <DealerListSection key={field} field={field} items={lists[field]} onEdit={() => setEditing(field)} onMakeMain={(i) => makeMain(field, i)} />
      ))}
      {editing && <DealerListSheet field={editing} items={lists[editing]} onSave={(items) => saveList(editing, items)} onClose={() => setEditing(null)} />}

      <FormError message={error} />
      {dealer && <DealerActions dealer={dealer} onDeleted={() => router.push(listHref)} />}
    </form>
  );
}
