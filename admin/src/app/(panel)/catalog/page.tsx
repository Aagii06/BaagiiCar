"use client";

import ChipTabs from "@/components/common/ChipTabs";
import { Field, FormError, inputClass, Select } from "@/components/common/Field";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import { errorMessage, useToast } from "@/components/common/Toast";
import PageHeader from "@/components/layout/PageHeader";
import { createRow, deleteRows, getBodyTypes, getBrands, getLocations, getModels, updateRow, uploadCatalogImage } from "@/lib/api/admin";
import { catalogImage } from "@/lib/api/config";
import type { Brand } from "@/lib/api/types";
import { useApi } from "@/lib/useApi";
import { cn } from "@/lib/utils";
import { ImageUp, Pencil, Plus, Trash2, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

type Tab = "brands" | "models" | "bodyTypes" | "locations";
const TABS: { value: Tab; label: string }[] = [
  { value: "brands", label: "Үйлдвэр" },
  { value: "models", label: "Загвар" },
  { value: "bodyTypes", label: "Биеийн хэлбэр" },
  { value: "locations", label: "Байршил" },
];

/** Backend table each tab writes to (`/api/base/:target`). */
const TARGET: Record<Tab, string> = { brands: "brands", models: "carModels", bodyTypes: "bodyTypes", locations: "locations" };

type FieldDef = {
  key: string;
  label: string;
  type?: "text" | "number" | "brand" | "image";
  required?: boolean;
  placeholder?: string;
  /** `type: "image"` — upload folder under backend public/uploads. */
  folder?: "bodyTypes" | "brands";
};

const FIELDS: Record<Tab, FieldDef[]> = {
  brands: [
    { key: "name", label: "Нэр", required: true, placeholder: "Toyota" },
    { key: "country", label: "Улс", placeholder: "Japan" },
    { key: "logo", label: "Лого", type: "image", folder: "brands", placeholder: "Файлын нэр эсвэл https://…" },
    { key: "sort_order", label: "Эрэмбэ", type: "number" },
  ],
  models: [
    { key: "brand_id", label: "Үйлдвэр", type: "brand", required: true },
    { key: "name", label: "Нэр", required: true, placeholder: "Land Cruiser" },
  ],
  bodyTypes: [
    { key: "name", label: "Нэр", required: true, placeholder: "Жийп" },
    { key: "image", label: "Дүрс", type: "image", folder: "bodyTypes", placeholder: "Файлын нэр эсвэл https://…" },
    { key: "sort_order", label: "Эрэмбэ", type: "number" },
  ],
  locations: [
    { key: "name", label: "Нэр", required: true, placeholder: "Улаанбаатар" },
    { key: "sort_order", label: "Эрэмбэ", type: "number" },
  ],
};

type Row = { id: number; name: string; subtitle?: string; image?: string | null; values: Record<string, unknown> };

async function loadTab(tab: Tab): Promise<{ rows: Row[]; brands: Brand[] }> {
  if (tab === "brands") {
    const brands = await getBrands();
    return {
      brands,
      rows: brands.map((b) => ({ id: b.id, name: b.name, subtitle: [b.country, b.car_count != null && `${b.car_count} зар`].filter(Boolean).join(" · "), image: catalogImage(b.logo, "brands"), values: { ...b } })),
    };
  }
  if (tab === "models") {
    const [models, brands] = await Promise.all([getModels(), getBrands()]);
    const brandName = new Map(brands.map((b) => [b.id, b.name]));
    return {
      brands,
      rows: models
        .map((m) => ({ id: m.id, name: m.name, subtitle: brandName.get(m.brand_id) ?? "—", values: { ...m } }))
        .sort((a, b) => (a.subtitle ?? "").localeCompare(b.subtitle ?? "") || a.name.localeCompare(b.name)),
    };
  }
  if (tab === "bodyTypes") {
    const rows = await getBodyTypes();
    return {
      brands: [],
      rows: rows.map((b) => ({ id: b.id, name: b.name, subtitle: b.car_count != null ? `${b.car_count} зар` : undefined, image: catalogImage(b.image, "bodyTypes"), values: { ...b } })),
    };
  }
  const rows = await getLocations();
  return { brands: [], rows: rows.map((l) => ({ id: l.id, name: l.name, values: { ...l } })) };
}

/** Preview + file upload (stores the returned file name); an https URL can still be typed by hand. */
function ImageInput({ value, folder, placeholder, onChange }: { value: string; folder: NonNullable<FieldDef["folder"]>; placeholder?: string; onChange: (v: string) => void }) {
  const toast = useToast();
  const [uploading, setUploading] = useState(false);
  const preview = catalogImage(value, folder);

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      onChange(await uploadCatalogImage(folder, file));
    } catch (err) {
      toast(errorMessage(err), "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-muted">
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element -- uploaded / remote catalog images
          <img src={preview} alt="" className="size-9 object-contain" />
        )}
      </span>
      <input className={cn(inputClass, "min-w-0 flex-1")} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      <label className={cn("flex h-12 shrink-0 cursor-pointer items-center gap-1 rounded-xl bg-primary-soft px-3 text-sm font-bold text-primary", uploading && "pointer-events-none opacity-60")}>
        <ImageUp className="size-4" />
        {uploading ? "…" : "Оруулах"}
        <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={pick} disabled={uploading} />
      </label>
    </div>
  );
}

function Editor({ tab, row, brands, onClose, onSaved }: { tab: Tab; row: Row | null; brands: Brand[]; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const fields = FIELDS[tab];
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.key, row?.values[f.key] != null ? String(row.values[f.key]) : ""]))
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body: Record<string, unknown> = {};
    for (const f of fields) {
      const v = values[f.key].trim();
      if (f.required && !v) return setError(`${f.label} оруулна уу`);
      body[f.key] = f.type === "number" || f.type === "brand" ? (v ? Number(v) : null) : v || null;
    }
    setBusy(true);
    setError(null);
    try {
      if (row) await updateRow(TARGET[tab], row.id, body);
      else await createRow(TARGET[tab], body);
      toast(row ? "Хадгаллаа" : "Нэмлээ");
      onSaved();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-dark/40" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="w-full max-w-md space-y-4 rounded-t-3xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">{row ? "Засах" : "Нэмэх"}</h2>
          <button type="button" onClick={onClose} aria-label="Хаах" className="grid size-9 place-items-center rounded-full bg-muted">
            <X className="size-4" />
          </button>
        </div>
        {fields.map((f) => (
          <Field key={f.key} label={f.label + (f.required ? " *" : "")}>
            {f.type === "brand" ? (
              <Select value={values[f.key]} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}>
                <option value="">Сонгох</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            ) : f.type === "image" && f.folder ? (
              <ImageInput value={values[f.key]} folder={f.folder} placeholder={f.placeholder} onChange={(v) => setValues({ ...values, [f.key]: v })} />
            ) : (
              <input
                className={inputClass}
                inputMode={f.type === "number" ? "numeric" : undefined}
                value={values[f.key]}
                placeholder={f.placeholder}
                onChange={(e) => setValues({ ...values, [f.key]: f.type === "number" ? e.target.value.replace(/\D/g, "") : e.target.value })}
              />
            )}
          </Field>
        ))}
        <FormError message={error} />
        <button disabled={busy} className="h-12 w-full rounded-xl bg-primary font-bold text-white disabled:opacity-60">
          {busy ? "Хадгалж байна…" : "Хадгалах"}
        </button>
      </form>
    </div>
  );
}

function CatalogInner() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const toast = useToast();
  const tab = (TABS.find((t) => t.value === sp.get("tab"))?.value ?? "brands") as Tab;
  const data = useApi(() => loadTab(tab), tab);
  const [editing, setEditing] = useState<Row | "new" | null>(null);
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all = data.data?.rows ?? [];
    return q ? all.filter((r) => `${r.name} ${r.subtitle ?? ""}`.toLowerCase().includes(q)) : all;
  }, [data.data, query]);

  const remove = async (row: Row) => {
    if (!window.confirm(`"${row.name}" устгах уу?`)) return;
    try {
      await deleteRows(TARGET[tab], [row.id]);
      toast("Устгалаа");
      data.reload();
    } catch (err) {
      toast(errorMessage(err), "error");
    }
  };

  return (
    <>
      <PageHeader
        title="Каталог"
        aside={
          <button onClick={() => setEditing("new")} className="flex items-center gap-1 rounded-xl bg-primary px-3 py-2 text-sm font-bold text-white">
            <Plus className="size-4" strokeWidth={2.6} />
            Нэмэх
          </button>
        }
      >
        <ChipTabs
          items={TABS}
          value={tab}
          onChange={(v) => {
            setQuery("");
            router.replace(`${pathname}?tab=${v}`);
          }}
        />
        <input className={inputClass} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Хайх" />
      </PageHeader>

      {data.loading && !data.data ? (
        <LoadingState />
      ) : data.error ? (
        <ErrorState message={data.error.message} onRetry={data.reload} />
      ) : !rows.length ? (
        <EmptyState title="Бичлэг алга" />
      ) : (
        <div className={cn("divide-y divide-border overflow-hidden rounded-2xl bg-card", data.loading && "opacity-60")}>
          {rows.map((row) => (
            <div key={row.id} className="flex items-center gap-3 px-3 py-2.5">
              {row.image !== undefined && (
                <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-muted text-sm font-bold">
                  {row.image ? (
                    // eslint-disable-next-line @next/next/no-img-element -- remote seeded logos
                    <img src={row.image} alt="" className="size-7 object-contain" />
                  ) : (
                    row.name[0]
                  )}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{row.name}</p>
                {row.subtitle && <p className="truncate text-xs text-muted-foreground">{row.subtitle}</p>}
              </div>
              <button onClick={() => setEditing(row)} aria-label="Засах" className="grid size-9 place-items-center rounded-lg hover:bg-muted">
                <Pencil className="size-4" />
              </button>
              <button onClick={() => remove(row)} aria-label="Устгах" className="grid size-9 place-items-center rounded-lg text-destructive hover:bg-destructive-soft">
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <Editor
          key={editing === "new" ? "new" : editing.id}
          tab={tab}
          row={editing === "new" ? null : editing}
          brands={data.data?.brands ?? []}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            data.reload();
          }}
        />
      )}
    </>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <CatalogInner />
    </Suspense>
  );
}
