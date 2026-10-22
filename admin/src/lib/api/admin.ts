import { apiFetch, listQuery, type ApiItemResponse, type ApiListResponse, type Condition } from "./client";
import type { BodyType, Brand, Car, CarFile, CarModel, Location, Message, User } from "./types";

const NOT_DELETED: Condition = ["status", "<>", "deleted"];
const NEWEST = [{ selector: "created_at", desc: true }];

// --- auth ------------------------------------------------------------------

type Session = { token: string; loggedUser: User };

export async function login(phonenumber: string, password: string) {
  const res = await apiFetch<ApiItemResponse<Session>>("/api/users/login", {
    method: "POST",
    auth: false,
    body: { phonenumber, password },
  });
  return res.data;
}

export async function getUserData() {
  const res = await apiFetch<{ success: boolean; loggedUser: User | null }>("/api/users/get-user-data", { method: "POST" });
  return res.loggedUser;
}

export async function changePassword(id: number, password: string, password_confirm: string, old_password?: string) {
  await apiFetch("/api/users/change-password", { method: "POST", body: { id, password, password_confirm, old_password } });
}

// --- generic /api/base/:target ---------------------------------------------

export async function countOf(target: string, filter: Condition[]) {
  const res = await apiFetch<ApiListResponse<unknown>>(`/api/base/${target}${listQuery({ filter, take: 1 })}`);
  return res.data.count;
}

async function listAll<T>(target: string, filter: Condition[] = [NOT_DELETED]) {
  const res = await apiFetch<ApiListResponse<T>>(`/api/base/${target}${listQuery({ filter })}`);
  return res.data.rows;
}

export async function createRow(target: string, body: object) {
  const res = await apiFetch<ApiItemResponse<{ id: number }>>(`/api/base/${target}`, { method: "POST", body });
  return res.data;
}

export async function updateRow(target: string, id: number, body: object) {
  await apiFetch(`/api/base/${target}/${id}`, { method: "PUT", body });
}

export async function deleteRows(target: string, ids: number[]) {
  await apiFetch(`/api/base/${target}`, { method: "DELETE", body: { ids } });
}

// --- catalog ---------------------------------------------------------------

/** `POST /api/upload/image` (admin): saves into `uploads/<folder>`, returns the file name for the image/logo column. */
export async function uploadCatalogImage(folder: "bodyTypes" | "brands" | "users", file: File) {
  const form = new FormData();
  form.append("folder", folder);
  form.append("image", file);
  const res = await apiFetch<ApiItemResponse<{ fileName: string }>>("/api/upload/image", { method: "POST", body: form });
  return res.data.fileName;
}

const bySort = <T extends { sort_order?: number | null; name: string }>(rows: T[]) =>
  [...rows].sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999) || a.name.localeCompare(b.name));

export const getBrands = () => listAll<Brand>("vwBrands", [["status", "=", "active"]]).then(bySort);
/** Alphabetical, with the "Other" catch-all model last. */
const byModelName = (a: { name: string }, b: { name: string }) =>
  Number(a.name === "Other") - Number(b.name === "Other") || a.name.localeCompare(b.name);

export const getModels = () => listAll<CarModel>("carModels").then((r) => [...r].sort(byModelName));
export const getBodyTypes = () => listAll<BodyType>("vwBodyTypes", [["status", "=", "active"]]).then(bySort);
export const getLocations = () => listAll<Location>("locations").then(bySort);

// --- cars ------------------------------------------------------------------

export interface CarFilter {
  status?: "pending" | "rejected" | "active" | "hidden" | "sold" | "deleted" | "featured";
  search?: string;
  page: number;
  pageSize: number;
}

export async function listCars({ status, search, page, pageSize }: CarFilter) {
  const filter: Condition[] = [];
  if (status === "featured") filter.push(["status", "=", "active"], ["is_featured", "=", 1]);
  else if (status) filter.push(["status", "=", status]);
  else filter.push(NOT_DELETED);
  if (search?.trim()) {
    const q = search.trim();
    if (/^\d+$/.test(q) && q.length <= 7) filter.push(["id", "=", Number(q)]);
    else if (/^\d{8}$/.test(q)) filter.push(["phonenumber", "=", q]);
    else filter.push(["name", "contains", q]);
  }
  const res = await apiFetch<ApiListResponse<Car>>(
    `/api/base/vwCars${listQuery({ filter, sort: NEWEST, take: pageSize, skip: (page - 1) * pageSize })}`
  );
  return res.data;
}

export async function recentCars(take = 5) {
  const res = await apiFetch<ApiListResponse<Car>>(`/api/base/vwCars${listQuery({ filter: [NOT_DELETED], sort: NEWEST, take })}`);
  return res.data.rows;
}

export async function getCar(id: number | string) {
  const res = await apiFetch<ApiItemResponse<Car | null>>(`/api/base/vwCars/${id}`);
  return res.data;
}

export async function getCarFiles(carId: number) {
  const res = await apiFetch<ApiListResponse<CarFile>>(
    `/api/base/allFiles${listQuery({ filter: [["object_name", "=", "cars"], ["data_id", "=", carId], NOT_DELETED] })}`
  );
  return [...res.data.rows].sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.id - b.id);
}

export async function approveCar(id: number) {
  await apiFetch("/api/cars/approve", { method: "POST", body: { id } });
}

/** Send a pending ad back to its owner with a reason. */
export async function rejectCar(id: number, reason: string) {
  await apiFetch("/api/cars/reject", { method: "POST", body: { id, reason } });
}

/** Temporarily take an active ad off the web (or put a hidden one back). */
export async function setHidden(id: number, hidden: boolean) {
  await apiFetch("/api/cars/set-hidden", { method: "POST", body: { id, hidden } });
}

export async function markSold(id: number) {
  await apiFetch("/api/cars/mark-sold", { method: "POST", body: { id } });
}

export type PhotoItem = { kind: "existing"; id: number; url: string } | { kind: "new"; file: File; url: string };

/** Fields `/api/cars/save` accepts; admins may also set `is_featured` and `status`. */
export type CarInput = Partial<
  Pick<
    Car,
    | "brand_id" | "car_model_id" | "body_type_id" | "location_id" | "manufactured_year" | "imported_year"
    | "price" | "mileage" | "fuel_type" | "transmission" | "drive_type" | "steering" | "engine_capacity"
    | "color" | "vin" | "phonenumber" | "description" | "is_featured" | "status"
  >
> & { id?: number };

/**
 * `POST /api/cars/save` (multipart). The server deletes every photo it
 * isn't told to keep, so existing photos must always be listed by id.
 */
export async function saveCar(input: CarInput, photos: PhotoItem[]) {
  const form = new FormData();
  form.append("data", JSON.stringify(input));
  photos.forEach((p, i) => {
    if (p.kind === "existing") form.append(`file${i}Info`, JSON.stringify({ id: p.id }));
    else {
      form.append(`file${i}`, p.file);
      form.append(`file${i}Info`, JSON.stringify({ original_name: p.file.name }));
    }
  });
  const res = await apiFetch<ApiItemResponse<{ id: number }>>("/api/cars/save", { method: "POST", body: form });
  return res.data.id;
}

/** Fields of a vwCars row that `/api/cars/save` validates, so a flag change re-sends them. */
export function carInputFrom(car: Car): CarInput {
  return {
    id: car.id,
    brand_id: car.brand_id,
    car_model_id: car.car_model_id,
    body_type_id: car.body_type_id,
    location_id: car.location_id,
    manufactured_year: car.manufactured_year,
    imported_year: car.imported_year,
    price: car.price != null ? Math.round(Number(car.price)) : null,
    mileage: car.mileage,
    fuel_type: car.fuel_type,
    transmission: car.transmission,
    drive_type: car.drive_type,
    steering: car.steering,
    engine_capacity: car.engine_capacity,
    color: car.color,
    vin: car.vin,
    phonenumber: car.phonenumber,
    description: car.description,
  };
}

/** Toggle "Онцлох" without touching the ad's photos. */
export async function setFeatured(car: Car, featured: boolean) {
  const files = await getCarFiles(car.id);
  const keep: PhotoItem[] = files.map((f) => ({ kind: "existing", id: f.id, url: "" }));
  await saveCar({ ...carInputFrom(car), is_featured: featured }, keep);
}

export async function deleteCar(id: number) {
  await deleteRows("cars", [id]);
}

// --- users -----------------------------------------------------------------

/** `excludeId` leaves the signed-in user out (they manage themselves from Профайл). */
export async function listUsers(search?: string, excludeId?: number, role?: string) {
  const filter: Condition[] = [NOT_DELETED];
  if (excludeId) filter.push(["id", "<>", excludeId]);
  if (role) filter.push(["role", "=", role]);
  const q = search?.trim();
  if (q) filter.push(/^\d+$/.test(q) ? ["phonenumber", "contains", q] : ["firstname", "contains", q]);
  const res = await apiFetch<ApiListResponse<User>>(`/api/base/users${listQuery({ filter, sort: NEWEST, take: 200 })}`);
  return res.data;
}

export interface CreateUserInput {
  phonenumber: string;
  firstname?: string | null;
  lastname?: string | null;
  email?: string | null;
  role: string;
  /** Dealer logo file name (uploads/users). */
  logo?: string | null;
  password: string;
  password_confirm: string;
}

/** `POST /api/users/create` — admin only; any role, including ADMIN. */
export async function createUser(body: CreateUserInput) {
  const res = await apiFetch<ApiItemResponse<{ id: number }>>("/api/users/create", { method: "POST", body });
  return res.data;
}

export async function getUser(id: number | string) {
  const res = await apiFetch<ApiItemResponse<User | null>>(`/api/base/users/${id}`);
  return res.data;
}

// --- web chat messages -----------------------------------------------------

export async function listMessages(status?: Message["status"]) {
  const res = await apiFetch<ApiListResponse<Message>>(
    `/api/base/messages${listQuery({ filter: status ? [["status", "=", status]] : [], sort: [...NEWEST, { selector: "id", desc: true }], take: 200 })}`
  );
  return res.data;
}

export const setMessageStatus = (id: number, status: Message["status"]) => updateRow("messages", id, { status });
export const deleteMessage = (id: number) => deleteRows("messages", [id]);
