"use client";

import { Field, FormError, inputClass, Select } from "@/components/common/Field";
import { getBodyTypes, getBrands, getLocations, getModels, saveCar, type CarInput, type PhotoItem } from "@/lib/api/cars";
import type { Car } from "@/lib/api/types";
import { bodyTypeLabel, CAR_STATUS, DRIVE_TYPES, FUEL_TYPES, STEERINGS, TRANSMISSIONS } from "@/lib/constants";
import { useApi } from "@/lib/useApi";
import { cn } from "@/lib/utils";
import { ImagePlus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const MAX_PHOTOS = 12;
const THIS_YEAR = new Date().getFullYear();

type FormState = Record<
  | "brand_id"
  | "car_model_id"
  | "body_type_id"
  | "location_id"
  | "manufactured_year"
  | "imported_year"
  | "price"
  | "mileage"
  | "fuel_type"
  | "transmission"
  | "drive_type"
  | "steering"
  | "engine_capacity"
  | "color"
  | "vin"
  | "phonenumber"
  | "description"
  | "status",
  string
> & { is_featured: boolean };

const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));

function initialState(car?: Car | null, phone?: string | null): FormState {
  return {
    brand_id: str(car?.brand_id),
    car_model_id: str(car?.car_model_id),
    body_type_id: str(car?.body_type_id),
    location_id: str(car?.location_id),
    manufactured_year: str(car?.manufactured_year),
    imported_year: str(car?.imported_year),
    price: str(car?.price ? Math.round(Number(car.price)) : ""),
    mileage: str(car?.mileage),
    fuel_type: str(car?.fuel_type),
    transmission: str(car?.transmission),
    drive_type: str(car?.drive_type),
    steering: str(car?.steering),
    engine_capacity: str(car?.engine_capacity ? Number(car.engine_capacity) : ""),
    color: str(car?.color),
    vin: str(car?.vin),
    phonenumber: str(car?.phonenumber ?? phone),
    description: str(car?.description),
    status: car?.status ?? "active",
    is_featured: Boolean(Number(car?.is_featured ?? 0)),
  };
}

const intOrNull = (v: string) => (v.trim() ? Number(v) : null);

function toInput(f: FormState): CarInput {
  return {
    brand_id: Number(f.brand_id),
    car_model_id: intOrNull(f.car_model_id),
    body_type_id: intOrNull(f.body_type_id),
    location_id: intOrNull(f.location_id),
    manufactured_year: intOrNull(f.manufactured_year),
    imported_year: intOrNull(f.imported_year),
    price: Number(f.price || 0),
    mileage: intOrNull(f.mileage),
    fuel_type: f.fuel_type || null,
    transmission: f.transmission || null,
    drive_type: f.drive_type || null,
    steering: f.steering || null,
    engine_capacity: f.engine_capacity ? f.engine_capacity : null,
    color: f.color.trim() || null,
    vin: f.vin.trim() || null,
    phonenumber: f.phonenumber || null,
    description: f.description.trim() || null,
    status: f.status,
    is_featured: f.is_featured,
  };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-card p-4">
      <h2 className="mb-4 text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

function Chips({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o === value ? "" : o)}
          aria-pressed={o === value}
          className={cn("rounded-xl border-[1.5px] px-3.5 py-2 text-sm font-semibold", o === value ? "border-foreground bg-foreground text-white" : "border-border bg-white hover:border-foreground/40")}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

/**
 * Create / edit an ad. Photos already on the server are passed in as
 * `existing` items and kept by id; new files are uploaded with the save.
 */
export default function CarForm({
  car,
  photos: initialPhotos = [],
  defaultPhone,
  onSaved,
}: {
  car?: Car | null;
  photos?: PhotoItem[];
  defaultPhone?: string | null;
  onSaved: (id: number) => void;
}) {
  const [f, setF] = useState<FormState>(() => initialState(car, defaultPhone));
  const [photos, setPhotos] = useState<PhotoItem[]>(initialPhotos);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const brands = useApi(getBrands);
  const models = useApi(() => (f.brand_id ? getModels(Number(f.brand_id)) : Promise.resolve([])), f.brand_id);
  const bodyTypes = useApi(getBodyTypes);
  const locations = useApi(getLocations);

  // Revoke object URLs of new photos when they leave the editor.
  const photosRef = useRef(photos);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);
  useEffect(() => () => photosRef.current.forEach((p) => p.kind === "new" && URL.revokeObjectURL(p.url)), []);

  const set = (k: Exclude<keyof FormState, "is_featured">, v: string) => setF((prev) => ({ ...prev, [k]: v }));
  const bind = (k: Exclude<keyof FormState, "is_featured">) => ({ value: f[k], onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => set(k, e.target.value) });
  const digits = (k: Exclude<keyof FormState, "is_featured">) => ({ value: f[k], inputMode: "numeric" as const, onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(k, e.target.value.replace(/\D/g, "")) });

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const room = MAX_PHOTOS - photos.length;
    const added = [...files]
      .filter((file) => /^image\/(jpeg|png|webp)$/.test(file.type))
      .slice(0, room)
      .map((file) => ({ kind: "new" as const, file, url: URL.createObjectURL(file) }));
    setPhotos((prev) => [...prev, ...added]);
  };

  const removePhoto = (i: number) =>
    setPhotos((prev) => {
      const p = prev[i];
      if (p.kind === "new") URL.revokeObjectURL(p.url);
      return prev.filter((_, j) => j !== i);
    });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.brand_id) return setError("Үйлдвэр сонгоно уу");
    if (!f.manufactured_year) return setError("Үйлдвэрлэсэн он оруулна уу");
    if (!f.price) return setError("Үнэ оруулна уу");
    setBusy(true);
    setError(null);
    try {
      const id = await saveCar({ ...toInput(f), ...(car ? { id: car.id } : {}) }, photos);
      onSaved(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Хадгалах үед алдаа гарлаа");
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <Section title="Зураг">
        <div className="grid grid-cols-3 gap-2">
          {photos.map((p, i) => (
            <div key={p.url} className="relative aspect-square overflow-hidden rounded-xl bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element -- local previews / backend uploads */}
              <img src={p.url} alt="" className="size-full object-cover" />
              {i === 0 && <span className="absolute bottom-1.5 left-1.5 rounded-md bg-dark px-1.5 py-0.5 text-[10px] font-bold text-white">Нүүр</span>}
              <button type="button" onClick={() => removePhoto(i)} aria-label="Зураг хасах" className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-dark/80 text-white">
                <X className="size-3.5" strokeWidth={3} />
              </button>
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-input text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary"
            >
              <ImagePlus className="size-6" />
              Зураг нэмэх
            </button>
          )}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">JPG, PNG, WEBP · {MAX_PHOTOS} хүртэл зураг. Эхний зураг нүүр зураг болно.</p>
        <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => (addFiles(e.target.files), (e.target.value = ""))} />
      </Section>

      <Section title="Үндсэн мэдээлэл">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Үйлдвэр *">
            <Select value={f.brand_id} onChange={(e) => setF((p) => ({ ...p, brand_id: e.target.value, car_model_id: "" }))} required>
              <option value="">Сонгох</option>
              {brands.data?.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Загвар">
            <Select {...bind("car_model_id")} disabled={!f.brand_id}>
              <option value="">Сонгох</option>
              {models.data?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Биеийн хэлбэр">
            <Select {...bind("body_type_id")}>
              <option value="">Сонгох</option>
              {bodyTypes.data?.map((b) => (
                <option key={b.id} value={b.id}>
                  {bodyTypeLabel(b.name)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Байршил">
            <Select {...bind("location_id")}>
              <option value="">Сонгох</option>
              {locations.data?.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Үйлдвэрлэсэн он *">
            <input className={inputClass} {...digits("manufactured_year")} maxLength={4} placeholder={String(THIS_YEAR - 5)} required />
          </Field>
          <Field label="Орж ирсэн он">
            <input className={inputClass} {...digits("imported_year")} maxLength={4} placeholder={String(THIS_YEAR - 2)} />
          </Field>
          <Field label="Үнэ (₮) *" hint={f.price ? `${Number(f.price).toLocaleString("en-US")}₮` : "Жишээ: 45000000"}>
            <input className={inputClass} {...digits("price")} placeholder="45000000" required />
          </Field>
          <Field label="Гүйлт (км)">
            <input className={inputClass} {...digits("mileage")} placeholder="120000" />
          </Field>
        </div>
      </Section>

      <Section title="Техникийн үзүүлэлт">
        <div className="space-y-5">
          <Field label="Түлш">
            <Chips options={FUEL_TYPES} value={f.fuel_type} onChange={(v) => set("fuel_type", v)} />
          </Field>
          <Field label="Хурдны хайрцаг">
            <Chips options={TRANSMISSIONS} value={f.transmission} onChange={(v) => set("transmission", v)} />
          </Field>
          <Field label="Хөтлөгч">
            <Chips options={DRIVE_TYPES} value={f.drive_type} onChange={(v) => set("drive_type", v)} />
          </Field>
          <Field label="Хүрд">
            <Chips options={STEERINGS} value={f.steering} onChange={(v) => set("steering", v)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Хөдөлгүүр (л)">
              <input className={inputClass} inputMode="decimal" value={f.engine_capacity} onChange={(e) => set("engine_capacity", e.target.value.replace(/[^\d.]/g, ""))} placeholder="2.5" />
            </Field>
            <Field label="Өнгө">
              <input className={inputClass} {...bind("color")} placeholder="Цагаан" />
            </Field>
            <Field label="VIN / Арлын дугаар">
              <input className={inputClass} {...bind("vin")} />
            </Field>
          </div>
        </div>
      </Section>

      <Section title="Тайлбар, холбоо барих">
        <div className="space-y-4">
          <Field label="Тайлбар">
            <textarea className={cn(inputClass, "h-auto min-h-32 py-3")} {...bind("description")} maxLength={5000} placeholder="Машины байдал, засвар үйлчилгээ, нэмэлт тоноглол…" />
          </Field>
          <Field label="Холбогдох утас" hint="Худалдан авагч энэ дугаар руу залгана">
            <input className={cn(inputClass, "sm:max-w-xs")} {...digits("phonenumber")} maxLength={8} placeholder="99112233" />
          </Field>
        </div>
      </Section>

      <Section title="Админ">
        <div className="space-y-4">
          <label className="flex items-center justify-between gap-4">
            <span>
              <span className="block text-sm font-semibold">Онцлох зар</span>
              <span className="block text-xs text-muted-foreground">Нүүр хуудсанд болон хайлтын эхэнд гарна</span>
            </span>
            <input type="checkbox" className="size-5 accent-[var(--primary)]" checked={f.is_featured} onChange={(e) => setF((p) => ({ ...p, is_featured: e.target.checked }))} />
          </label>
          {car && (
            <Field label="Төлөв">
              <Select {...bind("status")}>
                {Object.entries(CAR_STATUS)
                  .filter(([k]) => k !== "deleted")
                  .map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
              </Select>
            </Field>
          )}
        </div>
      </Section>

      <FormError message={error} />
      <div className="flex justify-end">
        <button disabled={busy} className="h-12 w-full rounded-xl bg-primary px-8 font-bold text-white hover:bg-primary-hover disabled:opacity-60">
          {busy ? "Хадгалж байна…" : car ? "Хадгалах" : "Зар нийтлэх"}
        </button>
      </div>
    </form>
  );
}
