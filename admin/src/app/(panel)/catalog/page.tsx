"use client";

import ChipTabs from "@/components/common/ChipTabs";
import { Field, FormError, inputClass, Select } from "@/components/common/Field";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import { useConfirm } from "@/components/common/Confirm";
import LoadMore from "@/components/common/LoadMore";
import { errorMessage, useToast } from "@/components/common/Toast";
import PageHeader from "@/components/layout/PageHeader";
import { createRow, deleteRows, getBodyTypes, getBrands, getLocations, listModelsPage, updateRow, uploadCatalogImage } from "@/lib/api/admin";
import { catalogImage } from "@/lib/api/config";
import type { Brand } from "@/lib/api/types";
import { useApi } from "@/lib/useApi";
import { cn } from "@/lib/utils";
import { ImageUp, Pencil, Plus, Trash2, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

/** Rows shown at first and added each time the list is scrolled to its end (models are fetched page by page). */
const PAGE_SIZE = 30;

type Tab = "brands" | "models" | "bodyTypes" | "locations";
const TABS: { value: Tab; label: string }[] = [
  { value: "brands", label: "Үйлдвэр" },
  { value: "models", label: "Загвар" },
  { value: "bodyTypes", label: "Төрөл" },
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
  // Models are many: only the brands (picker + names) load here, the rows come page by page from the server.
  if (tab === "models") return { brands: await getBrands(), rows: [] };
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
  const confirm = useConfirm();
  const tab = (TABS.find((t) => t.value === sp.get("tab"))?.value ?? "brands") as Tab;
  // Tagged with its tab: right after a switch the previous tab's rows are still in `data` and must not show.
  const data = useApi(() => loadTab(tab).then((res) => ({ ...res, tab })), tab);
  const tabData = data.data?.tab === tab ? data.data : undefined;
  const [editing, setEditing] = useState<Row | "new" | null>(null);
  const [query, setQuery] = useState("");
  // The server search runs once typing pauses.
  const [search, setSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setSearch(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const isModels = tab === "models";
  // Back to the first page whenever the tab or the search changes.
  const pageKey = `${tab}|${isModels ? search : query}`;
  const [paging, setPaging] = useState({ key: pageKey, take: PAGE_SIZE });
  const take = paging.key === pageKey ? paging.take : PAGE_SIZE;

  const brands = tabData?.brands;
  const models = useApi(() => {
    if (!isModels || !brands) return Promise.resolve(null);
    const q = search.toLowerCase();
    const brandIds = q ? brands.filter((b) => b.name.toLowerCase().includes(q)).map((b) => b.id) : [];
    // Tagged with the search it answers, so a next page (same key) can be told from a new search.
    return listModelsPage({ search, brandIds, take }).then((res) => ({ ...res, key: pageKey }));
  }, `${isModels}|${search}|${take}|${brands ? "b" : ""}`);

  const rows = useMemo<Row[]>(() => {
    if (isModels) {
      const brandName = new Map(brands?.map((b) => [b.id, b.name]));
      return (models.data?.rows ?? []).map((m) => ({ id: m.id, name: m.name, subtitle: brandName.get(m.brand_id) ?? "—", values: { ...m } }));
    }
    const q = query.trim().toLowerCase();
    const all = tabData?.rows ?? [];
    return q ? all.filter((r) => `${r.name} ${r.subtitle ?? ""}`.toLowerCase().includes(q)) : all;
  }, [isModels, brands, models.data, tabData, query]);
  const shown = isModels ? rows : rows.slice(0, take);
  const total = isModels ? (models.data?.count ?? 0) : rows.length;
  const list = isModels ? models : data;
  const loadingMore = isModels && models.loading && models.data?.key === pageKey;
  const reload = () => (isModels ? models.reload() : data.reload());

  const remove = async (row: Row) => {
    if (!(await confirm({ title: `"${row.name}" устгах уу?`, confirmLabel: "Устгах", tone: "danger", icon: Trash2 }))) return;
    try {
      await deleteRows(TARGET[tab], [row.id]);
      toast("Устгалаа");
      reload();
    } catch (err) {
      toast(errorMessage(err), "error");
    }
  };

  return (
    <>
      <PageHeader
        title="Каталог"
        back="/profile"
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

      {data.error || (isModels && models.error) ? (
        <ErrorState message={(data.error ?? models.error)!.message} onRetry={() => (data.error ? data.reload() : models.reload())} />
      ) : !tabData || (isModels && !models.data) ? (
        <LoadingState />
      ) : !rows.length ? (
        <EmptyState title="Бичлэг алга" />
      ) : (
        // A next page keeps the rows already shown bright; a new search / reload dims them.
        <div className={cn("divide-y divide-border overflow-hidden rounded-2xl bg-card", list.loading && !loadingMore && "opacity-60")}>
          {shown.map((row) => (
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
      {shown.length > 0 &&
        shown.length < total &&
        // While a page loads the sentinel is swapped out, so it can't ask for the same page twice; it fires again on remount.
        (list.loading ? (
          <p className="py-4 text-center text-xs font-semibold text-muted-foreground">Ачаалж байна…</p>
        ) : (
          <LoadMore key={`${pageKey}|${take}`} onMore={() => setPaging({ key: pageKey, take: take + PAGE_SIZE })} />
        ))}

      {editing && (
        <Editor
          key={editing === "new" ? "new" : editing.id}
          tab={tab}
          row={editing === "new" ? null : editing}
          brands={tabData?.brands ?? []}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
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
