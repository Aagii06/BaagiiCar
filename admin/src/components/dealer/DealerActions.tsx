"use client";

import { useConfirm } from "@/components/common/Confirm";
import { errorMessage, useToast } from "@/components/common/Toast";
import { deleteDealer } from "@/lib/api/admin";
import type { Dealer } from "@/lib/api/types";
import { Trash2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { tr } from "@/lib/i18n/translations";

/** Below a saved dealer's form: its ads, and delete (then `onDeleted`). */
export default function DealerActions({ dealer, onDeleted }: { dealer: Dealer; onDeleted: () => void }) {
  const toast = useToast();
  const confirm = useConfirm();

  const [removing, setRemoving] = useState(false);
  const remove = async () => {
    const ok = await confirm({
      title: tr("Дилерийг устгах уу?"),
      message: tr("{name} — вэб дээр харагдахаа болино. Зарууд нь устгагдахгүй.", { name: dealer.name }),
      confirmLabel: tr("Устгах"),
      tone: "danger",
      icon: Trash2,
    });
    if (!ok) return;
    setRemoving(true);
    try {
      await deleteDealer(dealer.id);
      toast(tr("Устгалаа"));
      onDeleted();
    } catch (err) {
      toast(errorMessage(err), "error");
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Link href={`/cars?dealer=${dealer.id}`} className="flex-1 rounded-xl bg-card py-3 text-center text-sm font-bold">
        {tr("Зарууд")}
      </Link>
      <button type="button" onClick={remove} disabled={removing} className="inline-flex items-center justify-center gap-2 disabled:opacity-60 flex-1 rounded-xl bg-destructive-soft py-3 text-sm font-bold text-destructive">
        {removing && <Loader2 className="size-4 animate-spin" />}
        {tr("Устгах")}
      </button>
    </div>
  );
}
