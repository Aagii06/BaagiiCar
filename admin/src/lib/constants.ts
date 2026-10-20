// Must match backend/config/constants.js — the save endpoint validates these.
export const FUEL_TYPES = ["Бензин", "Дизель", "Хайбрид", "Газ", "Цахилгаан"];
export const TRANSMISSIONS = ["Автомат", "Механик", "CVT", "Типтроник"];
export const DRIVE_TYPES = ["FWD", "RWD", "4WD"];
export const STEERINGS = ["Зүүн", "Баруун"];

/** Body type names are stored in Mongolian, shown as is. */
export function bodyTypeLabel(name: string | null | undefined) {
  return name ?? "";
}

export const ROLES = { admin: "ADMIN", dealer: "DEALER", customer: "CUSTOMER" } as const;
export const ROLE_LIST = Object.values(ROLES);

const ROLE_MN: Record<string, string> = { [ROLES.admin]: "Админ", [ROLES.dealer]: "Дилер", [ROLES.customer]: "Хэрэглэгч" };

export function roleLabel(role: string | null | undefined) {
  if (!role) return "";
  return ROLE_MN[role] ?? role;
}

export const CAR_STATUS: Record<string, { label: string; className: string }> = {
  // Dealer ads wait here until an admin approves them; hidden from the web.
  pending: { label: "Хүлээгдэж буй", className: "bg-amber-soft text-amber-ink" },
  active: { label: "Идэвхтэй", className: "bg-success-soft text-success" },
  sold: { label: "Зарагдсан", className: "bg-dark text-white" },
  deleted: { label: "Устгасан", className: "bg-destructive-soft text-destructive" },
};
