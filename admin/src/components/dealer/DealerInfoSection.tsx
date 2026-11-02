import { Field, inputClass, Select } from "@/components/common/Field";
import ImageInput from "@/components/common/ImageInput";
import { cn } from "@/lib/utils";

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
      <Field label="Нэр *">
        <input className={inputClass} value={value.name} onChange={set("name")} placeholder="Дилерийн нэр" required />
      </Field>
      <div>
        <span className="mb-1.5 block text-[13px] font-semibold">Лого</span>
        <ImageInput value={value.logo} onChange={(logo) => onChange({ ...value, logo })} folder="dealers" label="Лого оруулах" hint="Дөрвөлжин, тунгалаг дэвсгэртэй зураг хамгийн сайн харагдана" />
      </div>
      <Field label="Төлөв">
        <Select value={value.status} onChange={set("status")}>
          <option value="active">Идэвхтэй</option>
          <option value="inactive">Идэвхгүй</option>
        </Select>
      </Field>
      <Field label="Тайлбар">
        <textarea className={cn(inputClass, "h-auto min-h-24 py-3")} value={value.description} onChange={set("description")} maxLength={2000} />
      </Field>
    </section>
  );
}
