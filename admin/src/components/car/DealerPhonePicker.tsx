import { Field, PhoneInput } from "@/components/common/Field";
import { dealerPhones } from "@/lib/api/cars";
import type { Dealer } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { tr } from "@/lib/i18n/translations";

/**
 * An ad's contact number, checked from its dealer's numbers. `current`: an edited ad's saved number, still
 * offered when the dealer no longer has it. A dealer without numbers (older data) falls back to typing one in.
 */
export default function DealerPhonePicker({
  dealer,
  current,
  value,
  onChange,
}: {
  dealer: Dealer | null | undefined;
  current?: string | null;
  value: string;
  onChange: (phone: string) => void;
}) {
  const phones = dealerPhones(dealer);
  const extra = current && phones.length && !phones.includes(current) ? current : null;
  const options = extra ? [...phones, extra] : phones;

  if (!options.length)
    return (
      <Field label={tr("Холбогдох утас")} hint={tr("Худалдан авагч энэ дугаар руу залгана")}>
        <PhoneInput className="sm:max-w-xs" autoComplete="off" placeholder="00000000" value={value} onChange={onChange} />
      </Field>
    );

  return (
    <div>
      <span className="mb-1.5 block text-[13px] font-semibold">{tr("Холбогдох утас")}</span>
      <div role="radiogroup" aria-label={tr("Холбогдох утас")} className="divide-y divide-border overflow-hidden rounded-xl border border-input sm:max-w-xs">
        {options.map((phone) => {
          const checked = value === phone;
          return (
            <label key={phone} className="flex cursor-pointer items-center gap-3 bg-white px-4 py-3 hover:bg-muted/60">
              <input type="radio" name="phonenumber" className="peer sr-only" checked={checked} onChange={() => onChange(phone)} />
              <span
                className={cn(
                  "grid size-5 shrink-0 place-items-center rounded-md border-2 peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40",
                  checked ? "border-primary bg-primary text-white" : "border-input",
                )}
              >
                {checked && <Check className="size-3.5" strokeWidth={3} />}
              </span>
              <span className="flex-1 text-base font-semibold tabular-nums">{phone}</span>
              {phone === extra && <span className="text-xs text-muted-foreground">{tr("одоогийн")}</span>}
            </label>
          );
        })}
      </div>
      <span className="mt-1 block text-xs text-muted-foreground">{tr("Дилерийн бүртгэлтэй дугааруудаас сонгоно. Худалдан авагч энэ дугаар руу залгана")}</span>
    </div>
  );
}
