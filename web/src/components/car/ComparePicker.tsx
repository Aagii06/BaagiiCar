"use client";

import { COMPARE_MAX, useCompare } from "@/lib/compare/CompareProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useEffect } from "react";
import CarPicker from "./CarPicker";

/** Car picker on the compare page; stays open until the list is full. */
export default function ComparePicker({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const { ids, full, toggle } = useCompare();

  useEffect(() => {
    if (full) onClose();
  }, [full, onClose]);

  return (
    <CarPicker
      title={t("Машин нэмэх")}
      counter={`${ids.length} / ${COMPARE_MAX}`}
      isPicked={(id) => ids.includes(id)}
      onPick={(car) => toggle(car.id)}
      onClose={onClose}
    />
  );
}
