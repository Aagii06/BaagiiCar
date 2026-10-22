"use client";

import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

export const inputClass =
  "h-12 w-full rounded-xl border border-input bg-white px-4 text-[15px] outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:bg-muted";

export function Field({
  label,
  hint,
  error,
  className,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-[13px] font-semibold">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-destructive">{error}</span> : hint ? <span className="mt-1 block text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className="relative block">
      <select {...props} className={cn(inputClass, "appearance-none pr-10", className)}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </span>
  );
}

const PHONE_MASK = "________";

/** 8-digit phone field (same as the admin login): digits only, with an underscore mask after the caret while focused. */
export function PhoneInput({
  value,
  onChange,
  className,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> & { value: string; onChange: (digits: string) => void }) {
  const [focused, setFocused] = useState(false);
  const shown = value.replace(/\D/g, "").slice(0, PHONE_MASK.length);
  return (
    <span className="relative block">
      <input
        {...props}
        type="tel"
        inputMode="numeric"
        maxLength={PHONE_MASK.length}
        value={shown}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, PHONE_MASK.length))}
        onFocus={(e) => (setFocused(true), props.onFocus?.(e))}
        onBlur={(e) => (setFocused(false), props.onBlur?.(e))}
        className={cn(inputClass, "focus:placeholder:text-transparent", className)}
      />
      {focused && (
        // Typed part is invisible so the remaining underscores line up right after the caret.
        <span aria-hidden className="pointer-events-none absolute inset-y-0 left-[17px] flex items-center whitespace-pre text-[15px] text-muted-foreground/70">
          <span className="invisible">{shown}</span>
          {PHONE_MASK.slice(shown.length)}
        </span>
      )}
    </span>
  );
}
