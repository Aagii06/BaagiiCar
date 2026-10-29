"use client";

import { usePrompt } from "@/components/common/Confirm";
import { errorMessage, useToast } from "@/components/common/Toast";
import { rejectCar } from "@/lib/api/admin";
import type { Car } from "@/lib/api/types";
import { Undo2 } from "lucide-react";

/**
 * "Буцаах": asks the admin for a reason, then sends a pending ad back to its
 * owner. Resolves true when the ad was returned.
 */
export function useRejectCar() {
  const prompt = usePrompt();
  const toast = useToast();

  return async (car: Car, detail?: React.ReactNode) => {
    const reason = await prompt({
      title: "Зарыг буцаах уу?",
      message: "Зарын эзэн тайлбарыг хараад засаж, дахин илгээнэ.",
      detail,
      label: "Буцаах шалтгаан",
      placeholder: "Шалтгаанаа бичнэ үү",
      confirmLabel: "Буцаах",
      tone: "danger",
      icon: Undo2,
    });
    if (reason === null) return false;
    try {
      await rejectCar(car.id, reason);
      toast("Буцаалаа");
      return true;
    } catch (err) {
      toast(errorMessage(err), "error");
      return false;
    }
  };
}

/** The admin's note on a returned ad, shown on its preview and edit pages. */
export function RejectNote({ car, className }: { car: Car; className?: string }) {
  if (car.status !== "rejected" || !car.reject_reason) return null;
  return (
    <div className={className}>
      <div className="rounded-2xl border border-destructive/20 bg-destructive-soft p-3.5 text-destructive">
        <p className="flex items-center gap-1.5 text-sm font-bold">
          <Undo2 className="size-4" />
          Буцаасан шалтгаан
        </p>
        <p className="mt-1 whitespace-pre-line text-sm text-foreground">{car.reject_reason}</p>
        <p className="mt-1.5 text-xs text-muted-foreground">Эзэн нь засаад хадгалахад дахин батлуулахаар илгээгдэнэ.</p>
      </div>
    </div>
  );
}
