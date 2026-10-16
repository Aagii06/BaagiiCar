// Must match backend/config/constants.js — the save endpoint validates these.
export const FUEL_TYPES = ["Бензин", "Дизель", "Хайбрид", "Газ", "Цахилгаан"];
export const TRANSMISSIONS = ["Автомат", "Механик", "CVT", "Типтроник"];
export const DRIVE_TYPES = ["FWD", "RWD", "4WD", "AWD"];
export const STEERINGS = ["Зүүн", "Баруун"];

/** Seeded body types are English; the design shows them in Mongolian. */
const BODY_TYPE_MN: Record<string, string> = {
  SUV: "Жийп",
  Sedan: "Седан",
  Hatchback: "Хэтчбэк",
  Coupe: "Купе",
  Pickup: "Пикап",
  Van: "Микро",
  Wagon: "Универсал",
  Convertible: "Кабриолет",
  Electric: "Цахилгаан",
};

export function bodyTypeLabel(name: string | null | undefined) {
  if (!name) return "";
  return BODY_TYPE_MN[name] ?? name;
}

export const ROLES = { admin: "Админ", dealer: "Дилер", customer: "Хэрэглэгч" } as const;
export const ROLE_LIST = Object.values(ROLES);

export const CAR_STATUS: Record<string, { label: string; className: string }> = {
  active: { label: "Идэвхтэй", className: "bg-success-soft text-success" },
  sold: { label: "Зарагдсан", className: "bg-dark text-white" },
  deleted: { label: "Устгасан", className: "bg-destructive-soft text-destructive" },
};
