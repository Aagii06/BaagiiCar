import { Field, inputClass, Select } from "@/components/common/Field";
import ImageInput from "@/components/common/ImageInput";
import { cn } from "@/lib/utils";
import { tr } from "@/lib/i18n/translations";

export interface DealerInfo {
  name: string;
  logo: string;
  description: string;
  status: "active" | "inactive";
}

/** The dealer form's first card: name, logo, status and description. */
export default function DealerInfoSection({ value, onChange }: { value: DealerInfo; onChange: (value: DealerInfo) => void }) {
  const set = (k: keyof DealerInfo) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    onChange({ ...value, [k]: e.target.value });

  return (
    <section className="space-y-4 rounded-2xl bg-card p-4">
      <Field label={tr("Нэр *")}>
        <input className={inputClass} value={value.name} onChange={set("name")} placeholder={tr("Дилерийн нэр")} required />
      </Field>
      <div>
        <span className="mb-1.5 block text-[13px] font-semibold">{tr("Лого")}</span>
        <ImageInput value={value.logo} onChange={(logo) => onChange({ ...value, logo })} folder="dealers" label={tr("Лого оруулах")} hint={tr("Дөрвөлжин, тунгалаг дэвсгэртэй зураг хамгийн сайн харагдана")} />
      </div>
      <Field label={tr("Төлөв")}>
        <Select value={value.status} onChange={set("status")}>
          <option value="active">{tr("Идэвхтэй")}</option>
          <option value="inactive">{tr("Идэвхгүй")}</option>
        </Select>
      </Field>
      <Field label={tr("Тайлбар")}>
        <textarea className={cn(inputClass, "h-auto min-h-24 py-3")} value={value.description} onChange={set("description")} maxLength={2000} />
      </Field>
    </section>
  );
}
