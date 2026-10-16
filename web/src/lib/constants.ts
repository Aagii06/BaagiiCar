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

/** Leasing estimate: illustrative terms until a partner's real rates are wired in. */
export const LEASING = {
  downPaymentRate: 0.3,
  monthlyRate: 0.018,
  terms: [12, 24, 36, 48],
};

export function monthlyPayment(price: number, months: number, downRate = LEASING.downPaymentRate) {
  const principal = price * (1 - downRate);
  const r = LEASING.monthlyRate;
  if (!principal || !months) return 0;
  return (principal * r) / (1 - Math.pow(1 + r, -months));
}

export const PAGE_SIZE = 12;
