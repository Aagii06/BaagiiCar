"use client";

import { OptionSheet } from "@/components/common/Field";
import { LOCALE_NAMES, LOCALES, isLocale } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { Globe } from "lucide-react";
import { useState } from "react";

/** "MN" chip over a native select; on phones it opens the bottom-sheet picker instead. */
export default function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <label className={cn("relative flex h-11 items-center gap-1.5 rounded-xl bg-muted px-3 text-sm font-bold uppercase hover:bg-border", className)}>
      <Globe className="size-4" />
      {locale}
      <select
        value={locale}
        onChange={(e) => isLocale(e.target.value) && setLocale(e.target.value)}
        aria-label={t("Хэл")}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {LOCALES.map((l) => (
          <option key={l} value={l}>
            {LOCALE_NAMES[l]}
          </option>
        ))}
      </select>
      <button type="button" aria-haspopup="dialog" aria-expanded={open} aria-label={t("Хэл")} onClick={() => setOpen(true)} className="absolute inset-0 md:hidden" />
      {open && (
        <OptionSheet
          title={t("Хэл")}
          options={LOCALES.map((l) => ({ value: l, label: LOCALE_NAMES[l], text: LOCALE_NAMES[l] }))}
          value={locale}
          onPick={(l) => {
            setOpen(false);
            if (isLocale(l)) setLocale(l);
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </label>
  );
}
