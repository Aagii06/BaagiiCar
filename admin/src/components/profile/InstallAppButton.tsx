"use client";

import { useConfirm } from "@/components/common/Confirm";
import { isIos, useInstallPrompt } from "@/lib/installPrompt";
import { Download, Share } from "lucide-react";

/** "Апп суулгах": Chrome/Android get the browser's install dialog; iPhone (no such API) gets the steps. Hidden once installed. */
export default function InstallAppButton() {
  const { installed, canPrompt, prompt } = useInstallPrompt();
  const confirm = useConfirm();
  if (installed) return null;

  const showSteps = () =>
    confirm({
      title: "Нүүр дэлгэцэд нэмэх",
      icon: isIos() ? Share : Download,
      message: isIos()
        ? "Safari-гийн доод талын Share (□↑) товч → «Add to Home Screen» → «Add» дарна. Chrome-д хаягийн мөрний Share товчноос мөн адил."
        : "Браузерын ⋮ цэс → «Install app» эсвэл «Add to Home screen» → «Install» дарна.",
      confirmLabel: "Ойлголоо",
      cancelLabel: "Хаах",
    });

  return (
    <button
      type="button"
      onClick={() => (canPrompt ? prompt().catch(showSteps) : showSteps())}
      className="flex w-full items-center justify-between rounded-2xl bg-card px-4 py-3.5 font-semibold"
    >
      Апп суулгах
      <Download className="size-4" />
    </button>
  );
}
