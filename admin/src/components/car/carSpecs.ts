import type { Car } from "@/lib/api/types";
import { bodyTypeLabel } from "@/lib/constants";
import { formatEngine, formatNumber } from "@/lib/utils";
import { tr, trValue } from "@/lib/i18n/translations";

/** An ad's Үзүүлэлт as label / value pairs (value null when unknown); shared by the preview page and sheet. */
export function carSpecs(car: Car): [string, string | number | null | undefined][] {
  return [
    [tr("Үйлдвэрлэсэн он"), car.manufactured_year],
    [tr("Орж ирсэн он"), car.imported_year],
    [tr("Гүйлт"), car.mileage != null ? `${formatNumber(car.mileage)} ${tr("км")}` : null],
    [tr("Хөдөлгүүр"), car.engine_capacity ? formatEngine(car.engine_capacity) : null],
    [tr("Түлш"), trValue(car.fuel_type)],
    [tr("Хурдны хайрцаг"), trValue(car.transmission)],
    [tr("Хүрд"), trValue(car.steering)],
    [tr("Хөтлөгч"), car.drive_type],
    [tr("Зориулалт"), trValue(car.vehicle_type)],
    [tr("Гадна өнгө"), trValue(car.color)],
    [tr("Дотор өнгө"), trValue(car.interior_color)],
    [tr("Төрөл"), trValue(bodyTypeLabel(car.body_type_name))],
  ];
}
