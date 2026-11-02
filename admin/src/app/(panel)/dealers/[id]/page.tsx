"use client";

import { Field, FormError, inputClass, PhoneInput, Select } from "@/components/common/Field";
import ImageInput from "@/components/common/ImageInput";
import { EmptyState, ErrorState, FormSkeleton } from "@/components/common/States";
import { useConfirm } from "@/components/common/Confirm";
import { errorMessage, useToast } from "@/components/common/Toast";
import { DetailHeader } from "@/components/layout/PageHeader";
import { createDealer, dealerList, deleteDealer, getDealer, MAX_DEALER_CONTACTS, updateDealer, type DealerInput, type DealerListField } from "@/lib/api/admin";
import type { Dealer } from "@/lib/api/types";
import { useApi } from "@/lib/useApi";
import { useBackTo, withFrom } from "@/lib/useBackTo";
import { useRouteId } from "@/lib/useRouteId";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Loader2, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { createPortal } from "react-dom";

/** Lets the header's save icon submit the form via `form={DEALER_FORM_ID}`. */
const DEALER_FORM_ID = "dealer-form";

/** Filled, trimmed values; `lower` compares emails case-insensitively. */
const filledOf = (items: string[], lower = false) => items.map((v) => (lower ? v.trim().toLowerCase() : v.trim())).filter(Boolean);
const hasDuplicates = (items: string[]) => new Set(items).size !== items.length;

/** How each of the dealer's lists is titled, limited, typed in and checked. */
const LISTS: Record<
  DealerListField,
  {
    title: string;
    hint: string;
    addLabel: string;
    empty: string;
    max?: number;
    lower?: boolean;
    /** First problem with the cleaned values, or null. */
    check: (items: string[]) => string | null;
    input: (value: string, onValue: (v: string) => void, i: number) => React.ReactNode;
  }
> = {
  phonenumbers: {
    title: "Утасны дугаар",
    hint: `Зар оруулахдаа эдгээрээс нэгийг сонгоно (${MAX_DEALER_CONTACTS} хүртэл)`,
    addLabel: "Дугаар нэмэх",
    empty: "Дугаар нэмээгүй байна",
    max: MAX_DEALER_CONTACTS,
    check: (items) =>
      items.some((p) => p.length !== 8) ? "Утасны дугаар 8 оронтой тоо байна" : hasDuplicates(items) ? "Ижил дугаар давхардсан байна" : null,
    input: (value, onValue, i) => <PhoneInput autoComplete="off" placeholder="00000000" aria-label={`Утас ${i + 1}`} value={value} autoFocus={!value} onChange={onValue} />,
  },
  emails: {
    title: "И-мэйл",
    hint: `${MAX_DEALER_CONTACTS} хүртэл`,
    addLabel: "И-мэйл нэмэх",
    empty: "И-мэйл нэмээгүй байна",
    max: MAX_DEALER_CONTACTS,
    lower: true,
    check: (items) =>
      items.some((m) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m)) ? "И-мэйл формат буруу байна" : hasDuplicates(items) ? "Ижил и-мэйл давхардсан байна" : null,
    input: (value, onValue, i) => (
      <input className={inputClass} type="email" aria-label={`И-мэйл ${i + 1}`} value={value} autoFocus={!value} onChange={(e) => onValue(e.target.value)} placeholder="name@example.com" />
    ),
  },
  addresses: {
    title: "Хаяг, салбар",
    hint: "Салбар бүрийн хаягийг нэмнэ",
    addLabel: "Хаяг нэмэх",
    empty: "Хаяг нэмээгүй байна",
    check: (items) => (hasDuplicates(items) ? "Ижил хаяг давхардсан байна" : null),
    input: (value, onValue, i) => (
      <input className={inputClass} aria-label={`Хаяг ${i + 1}`} value={value} autoFocus={!value} onChange={(e) => onValue(e.target.value)} maxLength={255} placeholder="Хаяг" />
    ),
  },
};

const mainBadge = <span className="shrink-0 rounded-md bg-primary-soft px-2 py-1 text-[11px] font-bold text-primary">Үндсэн</span>;

/** One of the dealer's lists on the page: read-only rows, edited in `ListSheet`. */
function ListSection({ field, items, onEdit }: { field: DealerListField; items: string[]; onEdit: () => void }) {
  const cfg = LISTS[field];
  return (
    <section className="rounded-2xl bg-card p-4">
      <div className="mb-3 flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold">{cfg.title}</h2>
          <p className="text-xs text-muted-foreground">{cfg.hint}</p>
        </div>
        <button type="button" onClick={onEdit} className="flex shrink-0 items-center gap-1 rounded-xl bg-primary-soft px-3 py-2 text-sm font-bold text-primary hover:bg-primary/15">
          {items.length ? <Pencil className="size-3.5" /> : <Plus className="size-4" strokeWidth={2.6} />}
          {items.length ? "Засах" : "Нэмэх"}
        </button>
      </div>
      {items.length ? (
        <ul className="divide-y divide-border">
          {items.map((v, i) => (
            <li key={v} className="flex items-center gap-2 py-2.5">
              <span className="min-w-0 flex-1 break-words font-semibold">{v}</span>
              {i === 0 && mainBadge}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">{cfg.empty}</p>
      )}
    </section>
  );
}

/**
 * Modal for one list: add as many rows as needed, reorder with the arrows (the first is the main one), remove,
 * then one "Хадгалах" checks and saves them all and closes. Backdrop / Escape / "Болих" drops the changes.
 */
function ListSheet({
  field,
  items,
  onSave,
  onClose,
}: {
  field: DealerListField;
  items: string[];
  /** Resolves once saved; a thrown error stays in the sheet. */
  onSave: (items: string[]) => Promise<void>;
  onClose: () => void;
}) {
  const cfg = LISTS[field];
  // An empty list opens with one row ready to type in.
  const [draft, setDraft] = useState(() => (items.length ? items : [""]));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  /** Swaps row `i` with its neighbour `i + dir`. */
  const move = (i: number, dir: -1 | 1) => {
    const next = [...draft];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    setDraft(next);
  };
  const arrowClass = "grid h-5 w-8 place-items-center rounded-md text-muted-foreground hover:bg-muted disabled:opacity-30";

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    // React bubbles the portal's submit up to the dealer form; keep it here.
    e.stopPropagation();
    const clean = filledOf(draft, cfg.lower);
    const problem = cfg.check(clean);
    if (problem) return setError(problem);
    setBusy(true);
    setError(null);
    try {
      await onSave(clean);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  // Portaled out of the dealer form so Enter here saves this list, not the dealer.
  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 animate-fade-in bg-dark/50 backdrop-blur-[2px]" onClick={() => !busy && onClose()} />
      <form
        onSubmit={save}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dealer-list-title"
        className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[90dvh] max-w-md animate-sheet-up flex-col rounded-t-3xl bg-white pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl"
      >
        <div className="mx-auto mb-4 h-1 w-10 shrink-0 rounded-full bg-border" />
        <div className="px-5">
          <h2 id="dealer-list-title" className="text-lg font-bold">
            {cfg.title}
          </h2>
          <p className="text-xs text-muted-foreground">{cfg.hint}. Сумаар эрэмбэлнэ, эхнийх нь үндсэн</p>
        </div>
        <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto px-5 pb-1">
          {draft.map((value, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="min-w-0 flex-1">{cfg.input(value, (v) => setDraft(draft.map((p, j) => (j === i ? v : p))), i)}</div>
              {i === 0 && mainBadge}
              <div className="flex shrink-0 flex-col">
                <button type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Дээш зөөх" className={arrowClass}>
                  <ChevronUp className="size-4" />
                </button>
                <button type="button" disabled={i === draft.length - 1} onClick={() => move(i, 1)} aria-label="Доош зөөх" className={arrowClass}>
                  <ChevronDown className="size-4" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => setDraft(draft.filter((_, j) => j !== i))}
                aria-label="Хасах"
                className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground hover:bg-border"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
          {(cfg.max === undefined || draft.length < cfg.max) && (
            <button
              type="button"
              onClick={() => setDraft([...draft, ""])}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-3 text-sm font-bold text-primary hover:bg-muted/60"
            >
              <Plus className="size-4" strokeWidth={2.6} />
              {cfg.addLabel}
            </button>
          )}
        </div>
        <div className="shrink-0 px-5 pt-3">
          <FormError message={error} />
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={onClose} disabled={busy} className="h-12 flex-1 rounded-xl bg-muted font-bold hover:bg-border disabled:opacity-60">
              Болих
            </button>
            <button type="submit" disabled={busy} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary font-bold text-white hover:bg-primary-hover disabled:opacity-60">
              {busy && <Loader2 className="size-4 animate-spin" />}
              Хадгалах
            </button>
          </div>
        </div>
      </form>
    </div>,
    document.body,
  );
}

/** `listHref`: the list to return to after save / delete (keeps `?from=`). */
function DealerForm({ dealer, listHref, onBusyChange }: { dealer: Dealer | null; listHref: string; onBusyChange: (busy: boolean) => void }) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [f, setF] = useState({
    name: dealer?.name ?? "",
    logo: dealer?.logo ?? "",
    description: dealer?.description ?? "",
    status: dealer?.status === "inactive" ? "inactive" : "active",
  });
  // Phones, emails and addresses are edited in a modal (ListSheet); the first of each is the main one.
  const [lists, setLists] = useState<Record<DealerListField, string[]>>(() => ({
    phonenumbers: dealerList(dealer, "phonenumbers"),
    emails: dealerList(dealer, "emails"),
    addresses: dealerList(dealer, "addresses"),
  }));
  const [editing, setEditing] = useState<DealerListField | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => onBusyChange(busy), [busy, onBusyChange]);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF({ ...f, [k]: e.target.value });

  const bodyOf = (l: typeof lists): DealerInput => ({
    name: f.name.trim(),
    logo: f.logo || null,
    ...l,
    description: f.description.trim() || null,
    status: f.status as DealerInput["status"],
  });

  /** The modal's save: an existing dealer is saved right away, a new one keeps it until "Бүртгэх". */
  const saveList = async (field: DealerListField, items: string[]) => {
    const next = { ...lists, [field]: items };
    if (dealer) {
      if (!f.name.trim()) throw new Error("Дилерийн нэр оруулна уу");
      await updateDealer(dealer.id, bodyOf(next));
      toast("Хадгаллаа");
    }
    setLists(next);
    setEditing(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name.trim()) return setError("Дилерийн нэр оруулна уу");
    setBusy(true);
    setError(null);
    const body = bodyOf(lists);
    try {
      if (dealer) await updateDealer(dealer.id, body);
      else await createDealer(body);
      toast("Хадгаллаа");
      router.push(listHref);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!dealer) return;
    const ok = await confirm({
      title: "Дилерийг устгах уу?",
      message: `${dealer.name} — вэб дээр харагдахаа болино. Зарууд нь устгагдахгүй.`,
      confirmLabel: "Устгах",
      tone: "danger",
      icon: Trash2,
    });
    if (!ok) return;
    try {
      await deleteDealer(dealer.id);
      toast("Устгалаа");
      router.push(listHref);
    } catch (err) {
      toast(errorMessage(err), "error");
    }
  };

  return (
    <form id={DEALER_FORM_ID} onSubmit={submit} className="space-y-4">
      <section className="space-y-4 rounded-2xl bg-card p-4">
        <Field label="Нэр *">
          <input className={inputClass} value={f.name} onChange={set("name")} placeholder="Дилерийн нэр" required />
        </Field>
        <div>
          <span className="mb-1.5 block text-[13px] font-semibold">Лого</span>
          <ImageInput value={f.logo} onChange={(logo) => setF({ ...f, logo })} folder="dealers" label="Лого оруулах" hint="Дөрвөлжин, тунгалаг дэвсгэртэй зураг хамгийн сайн харагдана" />
        </div>
        <Field label="Төлөв">
          <Select value={f.status} onChange={set("status")}>
            <option value="active">Идэвхтэй</option>
            <option value="inactive">Идэвхгүй</option>
          </Select>
        </Field>
        <Field label="Тайлбар">
          <textarea className={cn(inputClass, "h-auto min-h-24 py-3")} value={f.description} onChange={set("description")} maxLength={2000} />
        </Field>
      </section>

      {(Object.keys(LISTS) as DealerListField[]).map((field) => (
        <ListSection key={field} field={field} items={lists[field]} onEdit={() => setEditing(field)} />
      ))}
      {editing && <ListSheet field={editing} items={lists[editing]} onSave={(items) => saveList(editing, items)} onClose={() => setEditing(null)} />}

      <FormError message={error} />
      {dealer && (
        <div className="flex gap-2">
          <Link href={`/cars?dealer=${dealer.id}`} className="flex-1 rounded-xl bg-card py-3 text-center text-sm font-bold">
            Зарууд
          </Link>
          <button type="button" onClick={remove} className="flex-1 rounded-xl bg-destructive-soft py-3 text-sm font-bold text-destructive">
            Устгах
          </button>
        </div>
      )}
    </form>
  );
}

export default function DealerPage() {
  return (
    <Suspense fallback={<FormSkeleton sections={[7]} />}>
      <DealerDetail />
    </Suspense>
  );
}

function DealerDetail() {
  const listHref = withFrom("/dealers", useBackTo("/dealers").from);
  const id = useRouteId();
  const isNew = id === "new";
  const data = useApi(() => (isNew ? Promise.resolve(null) : getDealer(id)), id);
  const [saving, setSaving] = useState(false);
  const formShown = isNew || (data.data && data.data.status !== "deleted");
  const saveLabel = isNew ? "Бүртгэх" : "Хадгалах";

  return (
    <>
      <DetailHeader
        title={isNew ? "Шинэ дилер" : (data.data?.name ?? "Дилер")}
        back={listHref}
        aside={
          formShown && (
            <button
              type="submit"
              form={DEALER_FORM_ID}
              disabled={saving}
              aria-label={saveLabel}
              title={saveLabel}
              className="grid size-10 place-items-center rounded-xl bg-primary text-white hover:bg-primary-hover disabled:opacity-60"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            </button>
          )
        }
      />
      {isNew ? (
        <DealerForm dealer={null} listHref={listHref} onBusyChange={setSaving} />
      ) : data.loading && !data.data ? (
        <FormSkeleton sections={[7]} />
      ) : data.error ? (
        <ErrorState message={data.error.message} onRetry={data.reload} />
      ) : !data.data || data.data.status === "deleted" ? (
        <EmptyState title="Дилер олдсонгүй" />
      ) : (
        <DealerForm key={data.data.id} dealer={data.data} listHref={listHref} onBusyChange={setSaving} />
      )}
    </>
  );
}
