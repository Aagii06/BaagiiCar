import type { Car } from "@/lib/api/types";
import { bodyTypeLabel } from "@/lib/constants";
import { formatEngine, formatNumber } from "@/lib/utils";

/** An ad's Үзүүлэлт as label / value pairs (value null when unknown); shared by the preview page and sheet. */
export function carSpecs(car: Car): [string, string | number | null | undefined][] {
  return [
    ["Үйлдвэрлэсэн он", car.manufactured_year],
    ["Орж ирсэн он", car.imported_year],
    ["Гүйлт", car.mileage != null ? `${formatNumber(car.mileage)} км` : null],
    ["Хөдөлгүүр", car.engine_capacity ? formatEngine(car.engine_capacity) : null],
    ["Түлш", car.fuel_type],
    ["Хурдны хайрцаг", car.transmission],
    ["Хүрд", car.steering],
    ["Хөтлөгч", car.drive_type],
    ["Ангилал", car.vehicle_type],
    ["Гадна өнгө", car.color],
    ["Дотор өнгө", car.interior_color],
    ["Төрөл", bodyTypeLabel(car.body_type_name)],
  ];
}
