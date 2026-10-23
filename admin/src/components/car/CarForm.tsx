"use client";

import { Field, FormError, inputClass, PhoneInput, Select } from "@/components/common/Field";
import PhotoViewer from "@/components/common/PhotoViewer";
import Stepper from "@/components/common/Stepper";
import { RejectNote } from "./useRejectCar";
import { DealerAvatar } from "./DealerPicker";
import PlateLookup from "./PlateLookup";
import PublishChoiceSheet from "./PublishChoiceSheet";
import { getBodyTypes, getBrands, getDealers, getLocations, getModels, parseAutobox, saveCar, type CarInput, type PhotoItem, type VehicleInfo } from "@/lib/api/cars";
import type { Car, CarModel, Dealer } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/AuthProvider";
import { bodyTypeLabel, CAR_STATUS, DRIVE_TYPES, EXTERIOR_COLORS, FUEL_TYPES, INTERIOR_COLORS, ROLES, STEERINGS, TRANSMISSIONS } from "@/lib/constants";
import { useApi } from "@/lib/useApi";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, ImagePlus, ShieldCheck, Store, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const MAX_PHOTOS = 12;
/** Wizard steps of a new ad (the last one is labelled Нийтлэх / Илгээх by role). */
const FORM_STEPS = ["Мэдээлэл", "Зураг", "Нийтлэх"];
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
  | "vehicle_type"
  | "engine_capacity"
  | "color"
  | "interior_color"
  | "vin"
  | "phonenumber"
  | "description"
  | "status",
  string
> & { is_featured: boolean };

/** Keeps a value saved before the list existed selectable. */
const withCurrent = (list: string[], current: string) => (current && !list.includes(current) ? [current, ...list] : list);

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
    vehicle_type: str(car?.vehicle_type),
    engine_capacity: str(car?.engine_capacity ? Number(car.engine_capacity) : ""),
    color: str(car?.color),
    interior_color: str(car?.interior_color),
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
    vehicle_type: f.vehicle_type.trim() || null,
    engine_capacity: f.engine_capacity ? f.engine_capacity : null,
    color: f.color.trim() || null,
    interior_color: f.interior_color.trim() || null,
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

function Chips({ options, value, onChange, disabled }: { options: string[]; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o === value ? "" : o)}
          aria-pressed={o === value}
          disabled={disabled}
          className={cn(
            "rounded-xl border-[1.5px] px-3.5 py-2 text-sm font-semibold disabled:cursor-not-allowed",
            o === value ? "border-foreground bg-foreground text-white" : "border-border bg-white hover:border-foreground/40 disabled:opacity-40 disabled:hover:border-border"
          )}
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
            {editable
              ? "Зар энэ дилерийн хуудсанд харагдана"
              : car?.seller_role === ROLES.dealer
                ? "Дилер өөрөө оруулсан тул солих боломжгүй"
                : "Таны дилерийн нэр дээр нийтлэгдэнэ"}
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
  leadingSteps = [],
  onBackToLead,
  onSaved,
  onBusyChange,
}: {
  car?: Car | null;
  photos?: PhotoItem[];
  defaultPhone?: string | null;
  /** New ad only: the admin's pick from the first step, or the signed-in dealer's own dealer. */
  dealer?: Dealer | null;
  /** New ad: steps shown before the form's own in the stepper (the admin's "Дилер"). */
  leadingSteps?: string[];
  /** New ad: go back to the leading step (re-pick the dealer); the form keeps what was entered. */
  onBackToLead?: () => void;
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
  /** Registry data saved with the ad: the lookup isn't offered again and its fields stay locked (the server keeps them too). */
  const [savedAutobox] = useState(() => parseAutobox(car));
  /** Fields filled from the registry (autobox) lookup; read-only so they match the official record. */
  const [locked, setLocked] = useState<ReadonlySet<keyof FormState>>(() => new Set(Object.keys(savedAutobox?.fields ?? {}) as (keyof FormState)[]));
  /** The number searched in this session; sent with the save so the server records the lookup. */
  const [lookup, setLookup] = useState<{ plate: string | null; vin: string | null } | null>(null);
  const isLocked = (k: keyof FormState) => locked.has(k);
  const fileInput = useRef<HTMLInputElement>(null);
  // A new ad is a wizard (Мэдээлэл → Зураг → Нийтлэх); editing keeps one long form.
  const wizard = !car;
  const [step, setStep] = useState(0);
  const lastStep = FORM_STEPS.length - 1;
  const show = (n: number) => !wizard || step === n;
  const [choosing, setChoosing] = useState(false);

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
  const bind = (k: Exclude<keyof FormState, "is_featured">) => ({ value: f[k], disabled: isLocked(k), onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => set(k, e.target.value) });
  const digits = (k: Exclude<keyof FormState, "is_featured">) => ({ value: f[k], disabled: isLocked(k), inputMode: "numeric" as const, onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(k, e.target.value.replace(/\D/g, "")) });

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
    put("vehicle_type", info.vehicle_type);
    put("engine_capacity", info.engine_capacity);
    put("mileage", info.mileage);
    put("color", info.color, EXTERIOR_COLORS);
    put("vin", info.vin);
    setF((p) => ({ ...p, ...fill, ...(brand && brand.id !== Number(p.brand_id) ? { car_model_id: "" } : {}) }));
    // A new lookup replaces the previous lock; fields the registry left empty stay editable.
    const lock = new Set(Object.keys(fill) as (keyof FormState)[]);
    setLocked(lock);
    setLookup({ plate: info.plate, vin: info.vin });
    pickModel.then((model) => {
      if (!model) return;
      setF((p) => (p.brand_id === String(brand!.id) ? { ...p, car_model_id: String(model.id) } : p));
      setLocked((prev) => (prev === lock ? new Set([...lock, "car_model_id"]) : prev));
    });

    const name = [info.brand, info.model, info.manufactured_year].filter(Boolean).join(" ");
    if (!brand) return `${name} олдлоо. "${info.brand ?? "—"}" үйлдвэр каталогид алга, гараар сонгоно уу`;
    return `${name} — бүртгэлийн мэдээлэл бөглөгдөж түгжигдлээ. Хурдны хайрцгийг сонгоно уу`;
  };

  // New ad: location shows / saves as Улаанбаатар until another one is picked.
  const ubId = locations.data?.find((l) => norm(l.name) === norm("Улаанбаатар"))?.id;
  const locationId = f.location_id || (wizard && ubId ? String(ubId) : "");

  // The admin went back and picked another dealer: switch to it, and to its phone unless one was typed in.
  const dealerId = dealer?.id;
  const dealerPhone = dealer?.phonenumber;
  const prevDealer = useRef(dealer);
  useEffect(() => {
    const prev = prevDealer.current;
    prevDealer.current = dealer;
    if (!wizard || !dealerId || prev?.id === dealerId) return;
    setF((p) => {
      const keepPhone = p.phonenumber && p.phonenumber !== (prev?.phonenumber || defaultPhone);
      return { ...p, dealer_id: String(dealerId), phonenumber: keepPhone ? p.phonenumber : (dealerPhone || defaultPhone || "") };
    });
  }, [wizard, dealer, dealerId, dealerPhone, defaultPhone]);

  const errorRef = useRef<HTMLDivElement>(null);
  useEffect(() => onBusyChange?.(busy), [busy, onBusyChange]);
  // The header button submits from the top; bring the message into view.
  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [error]);

  /** Required fields of the Мэдээлэл step (and of the whole form when editing); returns the first problem. */
  const detailsError = () => {
    if (!f.brand_id) return "Үйлдвэр сонгоно уу";
    if (!f.manufactured_year) return "Үйлдвэрлэсэн он оруулна уу";
    if (!f.imported_year) return "Орж ирсэн он оруулна уу";
    if (Number(f.imported_year) < Number(f.manufactured_year)) return "Орж ирсэн он үйлдвэрлэсэн оноос өмнө байж болохгүй";
    if (!f.price) return "Үнэ оруулна уу";
    if (!f.transmission) return "Хурдны хайрцаг сонгоно уу";
    return null;
  };

  const goTo = (next: number) => {
    setError(null);
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    // Enter / "Дараах" on an earlier step moves forward instead of saving.
    if (wizard && step < lastStep) {
      const problem = step === 0 ? detailsError() : null;
      return problem ? setError(problem) : goTo(step + 1);
    }
    if (!f.dealer_id && isAdmin) return setError("Дилер сонгоно уу");
    const problem = detailsError();
    if (problem) {
      if (wizard) setStep(0);
      return setError(problem);
    }
    // An admin publishing a new ad chooses featured / normal first.
    if (wizard && isAdmin) return setChoosing(true);
    save();
  };

  const save = async (featured?: boolean) => {
    setBusy(true);
    setError(null);
    try {
      const input: CarInput = {
        ...toInput({ ...f, location_id: locationId }, car),
        ...(featured !== undefined && { is_featured: featured }),
        ...(lookup && !savedAutobox && locked.size > 0 && { autobox_data: { ...lookup, fields: [...locked] } }),
      };
      const id = await saveCar({ ...input, ...(car ? { id: car.id } : {}) }, photos);
      onSaved(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Хадгалах үед алдаа гарлаа");
      setBusy(false);
    }
  };

  const finalLabel = isAdmin ? "Нийтлэх" : "Илгээх";

  return (
    <form id={CAR_FORM_ID} onSubmit={submit} className="space-y-5">
      {wizard && (
        <Stepper
          steps={[...leadingSteps, ...FORM_STEPS.slice(0, lastStep), finalLabel]}
          current={leadingSteps.length + step}
          onStepClick={(i) => (i < leadingSteps.length ? onBackToLead?.() : goTo(i - leadingSteps.length))}
        />
      )}
      {car && <RejectNote car={car} />}
      {show(0) &&
        (savedAutobox ? (
          <section className="flex items-center gap-3 rounded-2xl bg-card p-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-success-soft text-success">
              <ShieldCheck className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="font-bold">Бүртгэлээс татсан{savedAutobox.plate ? ` · ${savedAutobox.plate}` : ""}</p>
              <p className="text-xs text-muted-foreground">Бүртгэлийн мэдээллийг засах боломжгүй</p>
            </div>
          </section>
        ) : (
          <PlateLookup onFound={applyLookup} />
        ))}
      {/* In the wizard the dealer was settled before the form (admin's pick / the dealer's own). */}
      {!wizard && isAdmin && (
        <DealerSection
          car={car}
          value={f.dealer_id}
          dealers={dealers.data ?? (dealer ? [dealer] : [])}
          // Дилер өөрөө оруулсан зарын дилерийг солихгүй (сервер ч зөвшөөрөхгүй)
          editable={isAdmin && car?.seller_role !== ROLES.dealer}
          onChange={(id, phone) =>
            // Утас хоосон эсвэл өмнөх дилерийн / өөрийн дугаар байвал шинэ дилерийн дугаараар солино
            setF((p) => {
              const prevPhone = dealers.data?.find((d) => String(d.id) === p.dealer_id)?.phonenumber || me?.phonenumber;
              const keepPhone = p.phonenumber && p.phonenumber !== prevPhone;
              return { ...p, dealer_id: id, phonenumber: keepPhone ? p.phonenumber : (phone || me?.phonenumber || p.phonenumber) };
            })
          }
        />
      )}
      {show(1) && (
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
      )}

      {show(0) && (
        <Section title="Үндсэн мэдээлэл">
          <div className="grid grid-cols-2 gap-3">
            {/* Both years on one row: buyers compare them. */}
            <Field label="Үйлдвэр *">
              <Select value={f.brand_id} onChange={(e) => setF((p) => ({ ...p, brand_id: e.target.value, car_model_id: "" }))} disabled={isLocked("brand_id")} required>
                <option value="">Сонгох</option>
                {brands.data?.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Загвар">
              <Select {...bind("car_model_id")} disabled={!f.brand_id || isLocked("car_model_id")}>
                <option value="">Сонгох</option>
                {models.data?.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
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
            <Field label="Орж ирсэн он *">
              <Select {...bind("imported_year")} required>
                <option value="">Сонгох</option>
                {yearOptions(f.imported_year).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Байршил">
              <Select value={locationId} onChange={(e) => set("location_id", e.target.value)}>
                <option value="">Сонгох</option>
                {locations.data?.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Гүйлт (км)">
              <input className={inputClass} {...digits("mileage")} placeholder="120000" />
            </Field>
            <Field className="col-span-2" label="Үнэ (₮) *" hint={f.price ? `${Number(f.price).toLocaleString("en-US")}₮` : "Жишээ: 45000000"}>
              <input className={inputClass} {...digits("price")} placeholder="45000000" required />
            </Field>
          </div>
        </Section>
      )}

      {show(0) && (
        <Section title="Техникийн үзүүлэлт">
          <div className="space-y-5">
            <Field label="Түлш">
              <Chips options={FUEL_TYPES} value={f.fuel_type} onChange={(v) => set("fuel_type", v)} disabled={isLocked("fuel_type")} />
            </Field>
            <Field label="Хурдны хайрцаг *">
              <Chips options={TRANSMISSIONS} value={f.transmission} onChange={(v) => set("transmission", v)} disabled={isLocked("transmission")} />
            </Field>
            <Field label="Хөтлөгч">
              <Chips options={DRIVE_TYPES} value={f.drive_type} onChange={(v) => set("drive_type", v)} disabled={isLocked("drive_type")} />
            </Field>
            <Field label="Хүрд">
              <Chips options={STEERINGS} value={f.steering} onChange={(v) => set("steering", v)} disabled={isLocked("steering")} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Хөдөлгүүр (л)">
                <input className={inputClass} inputMode="decimal" disabled={isLocked("engine_capacity")} value={f.engine_capacity} onChange={(e) => set("engine_capacity", e.target.value.replace(/[^\d.]/g, ""))} placeholder="2.5" />
              </Field>
            </div>
          </div>
        </Section>
      )}

      {/* Optional details buyers care least about. */}
      {show(0) && (
        <Section title="Бусад мэдээлэл">
          <div className="grid grid-cols-2 gap-3">
            <Field className="col-span-2" label="Төрөл">
              <Select {...bind("body_type_id")}>
                <option value="">Сонгох</option>
                {bodyTypes.data?.map((b) => (
                  <option key={b.id} value={b.id}>
                    {bodyTypeLabel(b.name)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field className="col-span-2" label="Ангилал" hint="Бүртгэлээс бөглөгдөнө">
              <input className={inputClass} {...bind("vehicle_type")} maxLength={100} placeholder="Туулах чадвар сайтай" />
            </Field>
            <Field label="Гадна өнгө">
              <Select {...bind("color")}>
                <option value="">Сонгох</option>
                {withCurrent(EXTERIOR_COLORS, f.color).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Дотор өнгө">
              <Select {...bind("interior_color")}>
                <option value="">Сонгох</option>
                {withCurrent(INTERIOR_COLORS, f.interior_color).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </Section>
      )}

      {show(lastStep) && (
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
      )}

      {/* New ads ask featured / normal on publish (PublishChoiceSheet) instead. */}
      {isAdmin && !wizard && (
        <Section title="Админ">
          <div className="space-y-4">
            <label className="flex items-center justify-between gap-4">
              <span>
                <span className="block text-sm font-semibold">Онцлох зар</span>
                <span className="block text-xs text-muted-foreground">Нүүр хуудсанд болон хайлтын эхэнд гарна</span>
              </span>
              <input type="checkbox" className="size-5 accent-[var(--primary)]" checked={f.is_featured} onChange={(e) => setF((p) => ({ ...p, is_featured: e.target.checked }))} />
            </label>
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
          </div>
        </Section>
      )}

      <div ref={errorRef}>
        <FormError message={error} />
      </div>
      {wizard ? (
        <div className="flex gap-2">
          {(step > 0 || (leadingSteps.length > 0 && onBackToLead)) && (
            <button
              type="button"
              onClick={() => (step > 0 ? goTo(step - 1) : onBackToLead?.())}
              className="flex h-12 items-center justify-center gap-1 rounded-xl bg-card px-5 font-bold hover:bg-muted"
            >
              <ChevronLeft className="size-4" />
              Буцах
            </button>
          )}
          <button disabled={busy} className="flex h-12 flex-1 items-center justify-center gap-1 rounded-xl bg-primary px-6 font-bold text-white hover:bg-primary-hover disabled:opacity-60">
            {busy ? "Хадгалж байна…" : step < lastStep ? "Дараах" : isAdmin ? "Зар нийтлэх" : "Батлуулахаар илгээх"}
            {!busy && step < lastStep && <ChevronRight className="size-4" />}
          </button>
        </div>
      ) : (
        <div className="flex justify-end">
          <button disabled={busy} className="h-12 w-full rounded-xl bg-primary px-8 font-bold text-white hover:bg-primary-hover disabled:opacity-60">
            {busy ? "Хадгалж байна…" : "Хадгалах"}
          </button>
        </div>
      )}
      {choosing && (
        <PublishChoiceSheet
          onClose={() => setChoosing(false)}
          onChoose={(featured) => {
            setChoosing(false);
            save(featured);
          }}
        />
      )}
    </form>
  );
}
