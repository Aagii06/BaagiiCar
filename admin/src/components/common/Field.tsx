"use client";

import { cn } from "@/lib/utils";
import { ChevronDown, Eye, EyeOff } from "lucide-react";
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

export function PasswordInput({ className, ...props }: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [visible, setVisible] = useState(false);
  return (
    <span className="relative block">
      <input {...props} type={visible ? "text" : "password"} className={cn(inputClass, "pr-12", className)} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Нууц үг нуух" : "Нууц үг харуулах"}
        className="absolute right-1.5 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"
      >
        {visible ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
      </button>
    </span>
  );
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return <p className="rounded-xl bg-destructive-soft px-4 py-3 text-sm font-medium text-destructive">{message}</p>;
}
