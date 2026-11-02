import { inputClass, PhoneInput } from "@/components/common/Field";
import { MAX_DEALER_CONTACTS, type DealerListField } from "@/lib/api/admin";

/** Filled, trimmed values; `lower` compares emails case-insensitively. */
export const filledOf = (items: string[], lower = false) => items.map((v) => (lower ? v.trim().toLowerCase() : v.trim())).filter(Boolean);

const hasDuplicates = (items: string[]) => new Set(items).size !== items.length;

export interface DealerListConfig {
  title: string;
  hint: string;
  addLabel: string;
  empty: string;
  /** Rows allowed; none = no limit. */
  max?: number;
  lower?: boolean;
  /** First problem with the cleaned values, or null. */
  check: (items: string[]) => string | null;
  input: (value: string, onValue: (v: string) => void, i: number) => React.ReactNode;
}

/** How each of the dealer's lists (phones, emails, addresses) is titled, limited, typed in and checked. */
export const DEALER_LISTS: Record<DealerListField, DealerListConfig> = {
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

export const DEALER_LIST_FIELDS = Object.keys(DEALER_LISTS) as DealerListField[];
