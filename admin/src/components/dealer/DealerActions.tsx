"use client";

import { useConfirm } from "@/components/common/Confirm";
import { errorMessage, useToast } from "@/components/common/Toast";
import { deleteDealer } from "@/lib/api/admin";
import type { Dealer } from "@/lib/api/types";
import { Trash2 } from "lucide-react";
import Link from "next/link";
import { tr } from "@/lib/i18n/translations";

/** Below a saved dealer's form: its ads, and delete (then `onDeleted`). */
export default function DealerActions({ dealer, onDeleted }: { dealer: Dealer; onDeleted: () => void }) {
  const toast = useToast();
  const confirm = useConfirm();

  const remove = async () => {
    const ok = await confirm({
      title: tr("Дилерийг устгах уу?"),
      message: tr("{name} — вэб дээр харагдахаа болино. Зарууд нь устгагдахгүй.", { name: dealer.name }),
      confirmLabel: tr("Устгах"),
      tone: "danger",
      icon: Trash2,
    });
    if (!ok) return;
    try {
      await deleteDealer(dealer.id);
      toast(tr("Устгалаа"));
      onDeleted();
    } catch (err) {
      toast(errorMessage(err), "error");
    }
  };

  return (
    <div className="flex gap-2">
      <Link href={`/cars?dealer=${dealer.id}`} className="flex-1 rounded-xl bg-card py-3 text-center text-sm font-bold">
        {tr("Зарууд")}
      </Link>
      <button type="button" onClick={remove} className="flex-1 rounded-xl bg-destructive-soft py-3 text-sm font-bold text-destructive">
        {tr("Устгах")}
      </button>
    </div>
  );
}
