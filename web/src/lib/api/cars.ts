import type { MessageKey } from "../i18n/messages";
import { apiFetch, listQuery, type ApiItemResponse, type ApiListResponse, type Condition } from "./client";
import type { BodyType, Brand, Car, CarFile, CarModel } from "./types";

const NEWEST = [{ selector: "created_at", desc: true }];

export interface CarSearch {
  brandIds?: number[];
  modelId?: number;
  bodyTypeId?: number;
  yearFrom?: number;
  yearTo?: number;
  importedFrom?: number;
  importedTo?: number;
  /** In MNT. */
  priceMin?: number;
  priceMax?: number;
  fuelTypes?: string[];
  steering?: string;
  sort?: CarSort;
  page?: number;
  pageSize?: number;
}

export function searchConditions(s: CarSearch): Condition[] {
  const c: Condition[] = [["status", "=", "active"]];
  if (s.brandIds?.length) c.push(["brand_id", "in", s.brandIds]);
  if (s.modelId) c.push(["car_model_id", "=", s.modelId]);
  if (s.bodyTypeId) c.push(["body_type_id", "=", s.bodyTypeId]);
  if (s.yearFrom) c.push(["manufactured_year", ">=", s.yearFrom]);
  if (s.yearTo) c.push(["manufactured_year", "<=", s.yearTo]);
  if (s.importedFrom) c.push(["imported_year", ">=", s.importedFrom]);
  if (s.importedTo) c.push(["imported_year", "<=", s.importedTo]);
  if (s.priceMin) c.push(["price", ">=", s.priceMin]);
  if (s.priceMax) c.push(["price", "<=", s.priceMax]);
  if (s.fuelTypes?.length) c.push(["fuel_type", "in", s.fuelTypes]);
  if (s.steering) c.push(["steering", "=", s.steering]);
  return c;
}

export type CarSort = "new" | "old" | "priceAsc" | "priceDesc" | "views";

/** Sort menu on /cars, in display order. */
export const CAR_SORTS: { value: CarSort; label: MessageKey }[] = [
  { value: "new", label: "Шинэ нь эхэндээ" },
  { value: "old", label: "Хуучин нь эхэндээ" },
  { value: "priceAsc", label: "Үнэ өсөхөөр" },
  { value: "priceDesc", label: "Үнэ буурахаар" },
  { value: "views", label: "Их үзсэн" },
];

// `id` breaks ties so paging stays stable when values repeat.
const SORTS: Record<CarSort, { selector: string; desc: boolean }[]> = {
  new: [{ selector: "created_at", desc: true }, { selector: "id", desc: true }],
  old: [{ selector: "created_at", desc: false }, { selector: "id", desc: false }],
  priceAsc: [{ selector: "price", desc: false }, { selector: "id", desc: true }],
  priceDesc: [{ selector: "price", desc: true }, { selector: "id", desc: true }],
  views: [{ selector: "view_count", desc: true }, { selector: "id", desc: true }],
};

export async function searchCars(s: CarSearch) {
  const pageSize = s.pageSize ?? 12;
  const res = await apiFetch<ApiListResponse<Car>>(
    `/web/base/vwCars${listQuery({
      filter: searchConditions(s),
      sort: SORTS[s.sort ?? "new"],
      take: pageSize,
      skip: ((s.page ?? 1) - 1) * pageSize,
    })}`,
    { auth: false }
  );
  return res.data;
}

export async function featuredCars(take = 6) {
  const res = await apiFetch<ApiListResponse<Car>>(
    `/web/base/vwCars${listQuery({ filter: [["status", "=", "active"], ["is_featured", "=", 1]], sort: NEWEST, take })}`,
    { auth: false }
  );
  if (res.data.rows.length) return res.data.rows;
  // No featured ads yet — show the newest instead so the section isn't empty.
  return (await searchCars({ pageSize: take })).rows;
}

export async function getCar(id: number | string) {
  const res = await apiFetch<ApiItemResponse<Car | null>>(`/web/base/vwCars/${id}`, { auth: false });
  return res.data;
}

export async function getCarFiles(carId: number) {
  const res = await apiFetch<ApiListResponse<CarFile>>(
    `/web/base/allFiles${listQuery({ filter: [["data_id", "=", carId]] })}`,
    { auth: false }
  );
  return [...res.data.rows].sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.id - b.id);
}

export async function getBrands() {
  const res = await apiFetch<ApiListResponse<Brand>>("/web/base/vwBrands", { auth: false });
  return [...res.data.rows].sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999) || a.name.localeCompare(b.name));
}

export async function getModels(brandId?: number) {
  const q = brandId ? listQuery({ filter: [["brand_id", "=", brandId]] }) : "";
  const res = await apiFetch<ApiListResponse<CarModel>>(`/web/base/carModels${q}`, { auth: false });
  return [...res.data.rows].sort((a, b) => a.name.localeCompare(b.name));
}

export async function getBodyTypes() {
  const res = await apiFetch<ApiListResponse<BodyType>>("/web/base/vwBodyTypes", { auth: false });
  return [...res.data.rows].sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
}

// --- signed-in -------------------------------------------------------------

export async function getFavorites() {
  const res = await apiFetch<ApiListResponse<Car>>("/api/cars/favorites");
  return res.data.rows;
}

export async function toggleFavorite(carId: number) {
  const res = await apiFetch<ApiItemResponse<{ car_id: number; is_favorite: boolean }>>("/api/cars/favorite", {
    method: "POST",
    body: { car_id: carId },
  });
  return res.data.is_favorite;
}
