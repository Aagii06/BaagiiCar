// Must match backend/config/constants.js — the save endpoint validates these.
export const FUEL_TYPES = ["Бензин", "Дизель", "Хайбрид", "Газ", "Цахилгаан"];
export const TRANSMISSIONS = ["Автомат", "Механик", "CVT", "Типтроник"];
export const DRIVE_TYPES = ["FWD", "RWD", "4WD"];
export const STEERINGS = ["Зүүн", "Баруун"];
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
  return ROLE_MN[role] ?? role;
}

export const CAR_STATUS: Record<string, { label: string; className: string }> = {
  // Dealer ads wait here until an admin approves them; hidden from the web.
  pending: { label: "Хүлээгдэж буй", className: "bg-amber-soft text-amber-ink" },
  // Sent back to the owner with a reason; saving their edit resubmits it.
  rejected: { label: "Буцаасан", className: "bg-destructive-soft text-destructive" },
  active: { label: "Идэвхтэй", className: "bg-success-soft text-success" },
  sold: { label: "Зарагдсан", className: "bg-dark text-white" },
  // Temporarily taken off the web by an admin; "Ил гаргах" brings it back.
  hidden: { label: "Нуусан", className: "bg-muted text-muted-foreground" },
  deleted: { label: "Устгасан", className: "bg-destructive-soft text-destructive" },
};
