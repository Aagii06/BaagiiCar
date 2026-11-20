import { tr } from "@/lib/i18n/translations";

// Must match backend/config/constants.js — the save endpoint validates these.
export const FUEL_TYPES = ["Бензин", "Дизель", "Хайбрид", "Газ", "Цахилгаан"];
export const TRANSMISSIONS = ["Автомат", "Механик", "CVT", "Типтроник"];
export const DRIVE_TYPES = ["FWD", "RWD", "4WD"];
export const STEERINGS = ["Зүүн", "Баруун"];
/** Registry categories (autobox vehicleTypeName); a registry value outside this list is still kept on the ad. */
export const VEHICLE_TYPES = ["Суудлын", "Туулах чадвар сайтай", "Олон зориулалттай", "Ердийн тэвштэй автомашин", "Бүхээгтэй", "Микроавтобус", "Ачааны", "Автобус", "Тусгай зориулалтын", "Бусад"];
export const PLATE_TYPES = ["Дугаар аваагүй", "УБ дугаартай", "Орон нутаг дугаартай", "Тодорхойгүй"];

/** Region of a plate by its first two letters ("1234 ДАА" → Дархан-Уул). */
export const PLATE_REGIONS: Record<string, string> = {
  // Улаанбаатар
  УБ: "Улаанбаатар", УН: "Улаанбаатар", УА: "Улаанбаатар", УЕ: "Улаанбаатар", УК: "Улаанбаатар",
  БР: "Багануур (Улаанбаатар)", НА: "Налайх (Улаанбаатар)",
  // 21 аймаг
  АР: "Архангай", БӨ: "Баян-Өлгий", БХ: "Баянхонгор", БУ: "Булган", ГА: "Говь-Алтай", ГС: "Говьсүмбэр",
  ДА: "Дархан-Уул", ДГ: "Дорноговь", ДО: "Дорнод", ДУ: "Дундговь", ЗА: "Завхан", ОР: "Орхон",
  ӨВ: "Өвөрхангай", ӨМ: "Өмнөговь", СҮ: "Сүхбаатар", СЭ: "Сэлэнгэ", СБ: "Сэлэнгэ (Сүхбаатар хот)",
  ТӨ: "Төв", УВ: "Увс", ХО: "Ховд", ХӨ: "Хөвсгөл", ХЭ: "Хэнтий",
};

/** Codes counted as Ulaanbaatar plates (Багануур, Налайх included). */
const UB_PLATE_CODES = ["УБ", "УН", "УА", "УЕ", "УК", "БР", "НА"];

/** "1234 УБА" / "1234УБА" / "1234 уба" → { type: "ub", region: "Улаанбаатар" }; an unknown code → "unknown". */
export function classifyPlate(plate: string | null | undefined): { type: "ub" | "local" | "unknown"; region: string | null } {
  const code = (plate ?? "").replace(/[^А-ЯЁӨҮа-яёөү]/g, "").toUpperCase().slice(0, 2);
  if (UB_PLATE_CODES.includes(code)) return { type: "ub", region: PLATE_REGIONS[code] };
  if (PLATE_REGIONS[code]) return { type: "local", region: PLATE_REGIONS[code] };
  return { type: "unknown", region: null };
}

/** The form's plate_type for a plate: "УБ дугаартай" / "Орон нутаг дугаартай" / "Тодорхойгүй" (code not in the list); null with no plate. */
export function plateTypeOf(plate: string | null | undefined): string | null {
  if (!plate?.trim()) return null;
  const { type } = classifyPlate(plate);
  return type === "ub" ? "УБ дугаартай" : type === "local" ? "Орон нутаг дугаартай" : "Тодорхойгүй";
}
export const EXTERIOR_COLORS = ["Цагаан", "Хар", "Саарал", "Мөнгөлөг", "Улаан", "Цэнхэр", "Ногоон", "Шар", "Улбар шар", "Хүрэн", "Бор", "Шампань", "Ягаан", "Нил ягаан", "Бусад"];
export const INTERIOR_COLORS = ["Хар", "Саарал", "Бор", "Шаргал", "Цагаан", "Хүрэн", "Улаан", "Хослол", "Бусад"];

/** Body type names are stored in Mongolian, shown as is. */
export function bodyTypeLabel(name: string | null | undefined) {
  return name ?? "";
}

export const ROLES = { admin: "ADMIN", dealer: "DEALER", customer: "CUSTOMER" } as const;
/** Roles of `users` accounts; web visitors live in the separate `customers` table. */
export const ROLE_LIST = [ROLES.admin, ROLES.dealer];

const ROLE_MN: Record<string, string> = { [ROLES.admin]: "Админ", [ROLES.dealer]: "Дилер", [ROLES.customer]: "Хэрэглэгч" };

export function roleLabel(role: string | null | undefined) {
  if (!role) return "";
  return ROLE_MN[role] ? tr(ROLE_MN[role]) : role;
}

// Must match backend/config/constants.js (carRenewDays, carRestoreDays).
/** An active ad can be renewed (moved back to the top of the list) for free this many days after it was listed / last renewed. */
export const CAR_RENEW_DAYS = 7;
/** A deleted ad can be restored for this many days, then it is removed from the database for good. */
export const CAR_RESTORE_DAYS = 7;

export const CAR_STATUS: Record<string, { label: string; className: string }> = {
  // Dealer ads wait here until an admin approves them; hidden from the web.
  pending: { get label() { return tr("Хүлээгдэж буй"); }, className: "bg-amber-soft text-amber-ink" },
  // Sent back to the owner with a reason; saving their edit resubmits it.
  rejected: { get label() { return tr("Буцаасан"); }, className: "bg-destructive-soft text-destructive" },
  active: { get label() { return tr("Идэвхтэй"); }, className: "bg-success-soft text-success" },
  sold: { get label() { return tr("Зарагдсан"); }, className: "bg-dark text-white" },
  // Temporarily taken off the web by an admin; "Нийтлэх" brings it back.
  hidden: { get label() { return tr("Нуусан"); }, className: "bg-muted text-muted-foreground" },
  deleted: { get label() { return tr("Устгасан"); }, className: "bg-destructive-soft text-destructive" },
};
