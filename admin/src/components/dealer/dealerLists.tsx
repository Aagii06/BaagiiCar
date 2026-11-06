import { inputClass, PhoneInput } from "@/components/common/Field";
import { MAX_DEALER_CONTACTS, type DealerListField } from "@/lib/api/admin";
import AddressPicker from "./AddressPicker";
import { tr } from "@/lib/i18n/translations";

/** Filled, trimmed values; `lower` compares emails case-insensitively. */
export const filledOf = (items: string[], lower = false) => items.map((v) => (lower ? v.trim().toLowerCase() : v.trim())).filter(Boolean);

const hasDuplicates = (items: string[]) => new Set(items).size !== items.length;

/** 8 digits starting with 5–9, as Mongolian mobile and landline numbers do. */
const PHONE_RE = /^[5-9]\d{7}$/;
/** name@domain.tld: no spaces, no ".." or a dot at either end of the domain, a TLD of 2+ letters. */
const EMAIL_RE = /^[^\s@]+@(?!.*\.\.)[^\s@.][^\s@]*\.[a-z]{2,}$/i;

export interface DealerListConfig {
  title: string;
  hint: string;
  addLabel: string;
  empty: string;
  /** Rows allowed; none = no limit. */
  max?: number;
  lower?: boolean;
  /** What's wrong with one filled row, or null; shown under it once the row loses focus. */
  rowError?: (value: string) => string | null;
  /** First problem with the cleaned values, or null. */
  check: (items: string[]) => string | null;
  input: (value: string, onValue: (v: string) => void, i: number) => React.ReactNode;
}

/** How each of the dealer's lists (phones, emails, addresses) is titled, limited, typed in and checked. */
export const DEALER_LISTS: Record<DealerListField, DealerListConfig> = {
  phonenumbers: {
    get title() { return tr("Утасны дугаар"); },
    get hint() { return tr("Зар оруулахдаа эдгээрээс нэгийг сонгоно ({n} хүртэл)", { n: MAX_DEALER_CONTACTS }); },
    get addLabel() { return tr("Дугаар нэмэх"); },
    get empty() { return tr("Дугаар нэмээгүй байна"); },
    max: MAX_DEALER_CONTACTS,
    rowError: (v) => (PHONE_RE.test(v.trim()) ? null : tr("Утасны дугаар 5–9-өөр эхэлсэн 8 оронтой тоо байна")),
    check: (items) =>
      items.some((p) => !PHONE_RE.test(p))
        ? tr("Утасны дугаар 5–9-өөр эхэлсэн 8 оронтой тоо байна")
        : hasDuplicates(items)
          ? tr("Ижил дугаар давхардсан байна")
          : null,
    input: (value, onValue, i) => <PhoneInput autoComplete="off" placeholder="00000000" aria-label={tr("Утас {n}", { n: i + 1 })} value={value} autoFocus={!value} onChange={onValue} />,
  },
  emails: {
    get title() { return tr("И-мэйл"); },
    get hint() { return tr("{n} хүртэл", { n: MAX_DEALER_CONTACTS }); },
    get addLabel() { return tr("И-мэйл нэмэх"); },
    get empty() { return tr("И-мэйл нэмээгүй байна"); },
    max: MAX_DEALER_CONTACTS,
    lower: true,
    rowError: (v) => (EMAIL_RE.test(v.trim()) ? null : tr("И-мэйл формат буруу байна")),
    check: (items) =>
      items.some((m) => !EMAIL_RE.test(m)) ? tr("И-мэйл формат буруу байна") : hasDuplicates(items) ? tr("Ижил и-мэйл давхардсан байна") : null,
    input: (value, onValue, i) => (
      <input className={inputClass} type="email" aria-label={tr("И-мэйл {n}", { n: i + 1 })} value={value} autoFocus={!value} onChange={(e) => onValue(e.target.value)} placeholder="name@example.com" />
    ),
  },
  addresses: {
    get title() { return tr("Хаяг, салбар"); },
    get hint() { return tr("Салбар бүрийн хаягийг аймаг, сум, багаас сонгож нэмнэ"); },
    get addLabel() { return tr("Хаяг нэмэх"); },
    get empty() { return tr("Хаяг нэмээгүй байна"); },
    check: (items) => (hasDuplicates(items) ? tr("Ижил хаяг давхардсан байна") : null),
    input: (value, onValue, i) => <AddressPicker value={value} onChange={onValue} index={i} />,
  },
};

export const DEALER_LIST_FIELDS = Object.keys(DEALER_LISTS) as DealerListField[];
