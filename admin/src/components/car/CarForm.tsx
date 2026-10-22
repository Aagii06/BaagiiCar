"use client";

import { Field, FormError, inputClass, PhoneInput, Select } from "@/components/common/Field";
import PhotoViewer from "@/components/common/PhotoViewer";
import { RejectNote } from "./useRejectCar";
import { DealerAvatar } from "./DealerPicker";
import PlateLookup from "./PlateLookup";
import { getBodyTypes, getBrands, getDealers, getLocations, getModels, saveCar, type CarInput, type PhotoItem, type VehicleInfo } from "@/lib/api/cars";
import type { Car, CarModel, Dealer } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/AuthProvider";
import { bodyTypeLabel, CAR_STATUS, DRIVE_TYPES, FUEL_TYPES, ROLES, STEERINGS, TRANSMISSIONS } from "@/lib/constants";
import { useApi } from "@/lib/useApi";
import { cn } from "@/lib/utils";
import { ImagePlus, Store, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const MAX_PHOTOS = 12;
/** Lets a button outside the form (the page header) submit it via `form={CAR_FORM_ID}`. */
export const CAR_FORM_ID = "car-form";
const THIS_YEAR = new Date().getFullYear();
const MIN_YEAR = 1950;
/** Newest first; keeps an out-of-range value already saved on the car selectable. */
const yearOptions = (current: string) => {
  const years = Array.from({ length: THIS_YEAR - MIN_YEAR + 1 }, (_, i) => String(THIS_YEAR - i));
  return current && !years.includes(current) ? [current, ...years] : years;
};

type FormState = Record<
  | "dealer_id"
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

function initialState(car: Car | null | undefined, phone: string | null | undefined, dealerId: number | undefined): FormState {
  return {
    dealer_id: str(car ? car.dealer_id : dealerId),
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

function toInput(f: FormState, car?: Car | null): CarInput {
  return {
    // Засахад дилер өөрчлөгдсөн үед л илгээнэ (хуучин дилер нь идэвхгүй болсон байж болно)
    ...((!car || f.dealer_id !== str(car.dealer_id)) && { dealer_id: intOrNull(f.dealer_id) }),
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
    // Арлын дугаар баазад хадгалагдах ч UI-д харуулахгүй — засахад байсан утгыг хэвээр илгээнэ
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
/**
 * Which dealer the ad belongs to (required). Admins pick from active dealers (an ad's current dealer stays
 * selectable even if inactive now); a dealer only sees their own, read-only.
 */
function DealerSection({
  car,
  value,
  dealers,
  editable,
  onChange,
}: {
  car?: Car | null;
  value: string;
  dealers: Dealer[];
  editable: boolean;
  onChange: (id: string, phone: string | null) => void;
}) {
  const dealer = dealers.find((d) => String(d.id) === value);
  const current = car?.dealer_id && value === String(car.dealer_id) && !dealer;
  const name = dealer?.name ?? (current ? car?.dealer_name : null);

  return (
    <Section title="Дилер">
      <div className="flex items-center gap-3">
        {dealer || current ? (
          <DealerAvatar dealer={dealer ?? { name: car?.dealer_name ?? "", logo: car?.dealer_logo ?? null }} className="size-12" />
        ) : (
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
            <Store className="size-5" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          {editable ? (
            <Select
              value={value}
              onChange={(e) => {
                const id = e.target.value;
                onChange(id, dealers.find((d) => String(d.id) === id)?.phonenumber ?? null);
              }}
              className={value ? undefined : "text-muted-foreground"}
              required
            >
              {/* Older ads may have no dealer yet: one has to be picked before saving. */}
              {!value && <option value="">-- Сонгох --</option>}
              {current && <option value={value}>{car.dealer_name || `#${car.dealer_id}`} (одоогийн)</option>}
              {dealers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                  {d.phonenumber ? ` · ${d.phonenumber}` : ""}
                </option>
              ))}
            </Select>
          ) : (
            <p className="truncate font-bold">{name || "—"}</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            {editable ? "Зар энэ дилерийн хуудсанд харагдана" : "Таны дилерийн нэр дээр нийтлэгдэнэ"}
            {car && ` · Оруулсан: ${car.seller_name || car.seller_phone || "—"}`}
          </p>
        </div>
      </div>
    </Section>
  );
}

const norm = (s: string | null | undefined) => (s ?? "").toLowerCase().replace(/[\s-]+/g, "");

/** Registry model name → our catalog: exact match, else the longest name one contains the other ("Prius 30" ↔ "Prius"). */
function matchModel(models: CarModel[], name: string | null) {
  const n = norm(name);
  if (!n) return undefined;
  return (
    models.find((m) => norm(m.name) === n) ??
    models.filter((m) => norm(m.name) && (n.startsWith(norm(m.name)) || norm(m.name).startsWith(n))).sort((a, b) => b.name.length - a.name.length)[0]
  );
}

export default function CarForm({
  car,
  photos: initialPhotos = [],
  defaultPhone,
  dealer,
  onSaved,
  onBusyChange,
}: {
  car?: Car | null;
  photos?: PhotoItem[];
  defaultPhone?: string | null;
  /** New ad only: the admin's pick from the first step, or the signed-in dealer's own dealer. */
  dealer?: Dealer | null;
  onSaved: (id: number) => void;
  /** Mirrors the saving state to the header's save button. */
  onBusyChange?: (busy: boolean) => void;
}) {
  const { user: me } = useAuth();
  const isAdmin = me?.role === ROLES.admin;
  const [f, setF] = useState<FormState>(() => initialState(car, dealer?.phonenumber || defaultPhone, dealer?.id));
  const [photos, setPhotos] = useState<PhotoItem[]>(initialPhotos);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [viewing, setViewing] = useState<number | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const brands = useApi(getBrands);
  const models = useApi(() => (f.brand_id ? getModels(Number(f.brand_id)) : Promise.resolve([])), f.brand_id);
  const bodyTypes = useApi(getBodyTypes);
  const locations = useApi(getLocations);
  const dealers = useApi(getDealers);

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

  /** Fills the form from a registry lookup; only overwrites fields the registry knows. Returns a note for the user. */
  const applyLookup = (info: VehicleInfo) => {
    const brand = brands.data?.find((b) => norm(b.name) === norm(info.brand));
    // Models of the found brand are fetched right away so the model can be picked in the same step.
    const pickModel = brand
      ? getModels(brand.id).then((rows) => matchModel(rows, info.model))
      : Promise.resolve(undefined);
    const fill: Partial<FormState> = {};
    const put = (k: Exclude<keyof FormState, "is_featured">, v: string | number | null | undefined, allowed?: string[]) => {
      if (v === null || v === undefined || v === "") return;
      if (allowed && !allowed.includes(String(v))) return;
      fill[k] = String(v);
    };
    if (brand) fill.brand_id = String(brand.id);
    put("manufactured_year", info.manufactured_year);
    put("imported_year", info.imported_year);
    put("fuel_type", info.fuel_type, FUEL_TYPES);
    put("transmission", info.transmission, TRANSMISSIONS);
    put("drive_type", info.drive_type, DRIVE_TYPES);
    put("steering", info.steering, STEERINGS);
    put("engine_capacity", info.engine_capacity);
    put("mileage", info.mileage);
    put("color", info.color);
    put("vin", info.vin);
    setF((p) => ({ ...p, ...fill, ...(brand && brand.id !== Number(p.brand_id) ? { car_model_id: "" } : {}) }));
    pickModel.then((model) => model && setF((p) => (p.brand_id === String(brand!.id) ? { ...p, car_model_id: String(model.id) } : p)));

    const name = [info.brand, info.model, info.manufactured_year].filter(Boolean).join(" ");
    if (!brand) return `${name} олдлоо. "${info.brand ?? "—"}" үйлдвэр каталогид алга, гараар сонгоно уу`;
    return `${name} — мэдээлэл бөглөгдлөө. Загвар, хурдны хайрцгийг шалгана уу`;
  };

  const errorRef = useRef<HTMLDivElement>(null);
  useEffect(() => onBusyChange?.(busy), [busy, onBusyChange]);
  // The header button submits from the top; bring the message into view.
  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [error]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!f.dealer_id && isAdmin) return setError("Дилер сонгоно уу");
    if (!f.brand_id) return setError("Үйлдвэр сонгоно уу");
    if (!f.manufactured_year) return setError("Үйлдвэрлэсэн он оруулна уу");
    if (!f.price) return setError("Үнэ оруулна уу");
    setBusy(true);
    setError(null);
    try {
      const id = await saveCar({ ...toInput(f, car), ...(car ? { id: car.id } : {}) }, photos);
      onSaved(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Хадгалах үед алдаа гарлаа");
      setBusy(false);
    }
  };

  return (
    <form id={CAR_FORM_ID} onSubmit={submit} className="space-y-5">
      {car && <RejectNote car={car} />}
      <PlateLookup onFound={applyLookup} />
      <DealerSection
        car={car}
        value={f.dealer_id}
        dealers={dealers.data ?? (dealer ? [dealer] : [])}
        editable={isAdmin}
        onChange={(id, phone) =>
          // Утас хоосон эсвэл өмнөх дилерийн / өөрийн дугаар байвал шинэ дилерийн дугаараар солино
          setF((p) => {
            const prevPhone = dealers.data?.find((d) => String(d.id) === p.dealer_id)?.phonenumber || me?.phonenumber;
            const keepPhone = p.phonenumber && p.phonenumber !== prevPhone;
            return { ...p, dealer_id: id, phonenumber: keepPhone ? p.phonenumber : (phone || me?.phonenumber || p.phonenumber) };
          })
        }
      />
      <Section title="Зураг">
        <div className="grid grid-cols-3 gap-2">
          {photos.map((p, i) => (
            <div key={p.url} className="relative aspect-square overflow-hidden rounded-xl bg-muted">
              <button type="button" onClick={() => setViewing(i)} aria-label="Зураг томоор харах" className="size-full">
                {/* eslint-disable-next-line @next/next/no-img-element -- local previews / backend uploads */}
                <img src={p.url} alt="" className="size-full object-cover" />
              </button>
              {i === 0 && <span className="pointer-events-none absolute bottom-1.5 left-1.5 rounded-md bg-dark px-1.5 py-0.5 text-[10px] font-bold text-white">Нүүр</span>}
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
        {viewing !== null && <PhotoViewer urls={photos.map((p) => p.url)} start={viewing} onClose={() => setViewing(null)} />}
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
          <Field label="Төрөл">
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
            <Select {...bind("manufactured_year")} required>
              <option value="">Сонгох</option>
              {yearOptions(f.manufactured_year).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Орж ирсэн он">
            <Select {...bind("imported_year")}>
              <option value="">Сонгох</option>
              {yearOptions(f.imported_year).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </Select>
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
          </div>
        </div>
      </Section>

      <Section title="Тайлбар, холбоо барих">
        <div className="space-y-4">
          <Field label="Тайлбар">
            <textarea className={cn(inputClass, "h-auto min-h-32 py-3")} {...bind("description")} maxLength={5000} placeholder="Машины байдал, засвар үйлчилгээ, нэмэлт тоноглол…" />
          </Field>
          <Field label="Холбогдох утас" hint="Худалдан авагч энэ дугаар руу залгана">
            <PhoneInput className="sm:max-w-xs" autoComplete="off" placeholder="00000000" value={f.phonenumber} onChange={(v) => set("phonenumber", v)} />
          </Field>
        </div>
      </Section>

      {isAdmin && (
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
      )}

      <div ref={errorRef}>
        <FormError message={error} />
      </div>
      <div className="flex justify-end">
        <button disabled={busy} className="h-12 w-full rounded-xl bg-primary px-8 font-bold text-white hover:bg-primary-hover disabled:opacity-60">
          {busy ? "Хадгалж байна…" : car ? "Хадгалах" : isAdmin ? "Зар нийтлэх" : "Батлуулахаар илгээх"}
        </button>
      </div>
    </form>
  );
}
