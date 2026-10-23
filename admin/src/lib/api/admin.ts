import { apiFetch, listQuery, type ApiItemResponse, type ApiListResponse, type Condition } from "./client";
import { ROLES } from "@/lib/constants";
import type { BodyType, Brand, Car, CarFile, CarModel, Customer, Dealer, Location, Message, User } from "./types";

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

type OtpSent = { expires_in: number; resend_in: number };

/** Sends a 6-digit code to the new address; the email changes only after `verifyEmailChange`. */
export async function sendEmailChangeCode(email: string) {
  const res = await apiFetch<ApiItemResponse<OtpSent>>("/api/users/email-change/send", { method: "POST", body: { email } });
  return res.data;
}

/** Checks the code and saves the email; returns the updated user. */
export async function verifyEmailChange(email: string, code: string) {
  const res = await apiFetch<ApiItemResponse<User>>("/api/users/email-change/verify", { method: "POST", body: { email, code } });
  return res.data;
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

export type UploadFolder = "bodyTypes" | "brands" | "users" | "dealers";

/** `POST /api/upload/image` (admin): saves into `uploads/<folder>`, returns the file name for the image/logo/profile column. */
export async function uploadCatalogImage(folder: UploadFolder, file: File) {
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

/** One page of the catalog's models by name; a search also matches models of `brandIds` (brands whose name fits it). */
export async function listModelsPage({ search, brandIds = [], take }: { search?: string; brandIds?: number[]; take: number }) {
  const filter: Condition[] = [NOT_DELETED];
  const q = search?.trim();
  if (q) filter.push((brandIds.length ? [["name", "contains", q], "or", ["brand_id", "in", brandIds]] : ["name", "contains", q]) as Condition);
  const res = await apiFetch<ApiListResponse<CarModel>>(
    `/api/base/carModels${listQuery({ filter, sort: [{ selector: "name", desc: false }, { selector: "id", desc: false }], take })}`
  );
  return res.data;
}
export const getBodyTypes = () => listAll<BodyType>("vwBodyTypes", [["status", "=", "active"]]).then(bySort);
export const getLocations = () => listAll<Location>("locations").then(bySort);

// --- cars ------------------------------------------------------------------

export type CarStatusFilter = "pending" | "rejected" | "active" | "hidden" | "sold" | "deleted" | "featured";

export interface CarFilter {
  /** Any of these (OR); empty = every status but deleted. */
  statuses?: CarStatusFilter[];
  /** Only ads this user entered (`created_by`). */
  createdBy?: number;
  dealerId?: number;
  search?: string;
  page: number;
  pageSize: number;
}

export async function listCars({ statuses = [], createdBy, dealerId, search, page, pageSize }: CarFilter) {
  const filter: Condition[] = [];
  if (createdBy) filter.push(["created_by", "=", createdBy]);
  if (dealerId) filter.push(["dealer_id", "=", dealerId]);
  const plain = statuses.filter((s) => s !== "featured");
  const groups: unknown[] = [];
  if (plain.length) groups.push(["status", "in", plain]);
  // "featured" isn't a status: active ads with the flag on.
  if (statuses.includes("featured")) groups.push([["status", "=", "active"], "and", ["is_featured", "=", 1]]);
  if (!groups.length) filter.push(NOT_DELETED);
  else if (groups.length === 1) filter.push(groups[0] as Condition);
  else filter.push([groups[0], "or", groups[1]] as unknown as Condition);
  if (search?.trim()) {
    const q = search.trim();
    if (/^\d{9,}$/.test(q)) filter.push(["code", "contains", q]);
    else if (/^\d+$/.test(q) && q.length <= 7) filter.push(["id", "=", Number(q)]);
    else if (/^\d{8}$/.test(q)) filter.push(["phonenumber", "=", q]);
    else filter.push(["name", "contains", q]);
  }
  const res = await apiFetch<ApiListResponse<Car>>(
    `/api/base/vwCars${listQuery({ filter, sort: NEWEST, take: pageSize, skip: (page - 1) * pageSize })}`
  );
  return res.data;
}

/** "YYYY-MM-DD HH:mm:ss" in Ulaanbaatar time (+08:00), the way the backend stamps `created_at`. */
const ubTimestamp = (ms: number) => new Date(ms + 8 * 3600_000).toISOString().slice(0, 19).replace("T", " ");

/** Ads added in the last `days` days (rolling), newest first; `take` grows for "Цааш үзэх". */
export async function recentCars({ days = 2, take }: { days?: number; take: number }) {
  const since = ubTimestamp(Date.now() - days * 24 * 3600_000);
  const res = await apiFetch<ApiListResponse<Car>>(
    `/api/base/vwCars${listQuery({ filter: [NOT_DELETED, ["created_at", ">=", since]], sort: NEWEST, take })}`
  );
  return res.data;
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
    | "price" | "mileage" | "fuel_type" | "transmission" | "drive_type" | "steering" | "vehicle_type" | "engine_capacity"
    | "color" | "interior_color" | "vin" | "phonenumber" | "description" | "is_featured" | "status"
  >
> & {
  id?: number;
  /** Admin only: an active dealer's id, or null for an ad without a dealer. Omit to keep it. */
  dealer_id?: number | null;
  /** Registry lookup the form was filled from; the server stores the listed fields' values once and keeps them on later edits. */
  autobox_data?: { plate: string | null; vin: string | null; fields: string[] } | null;
};

/** What was saved from the registry lookup, or null for an ad typed in by hand. */
export interface AutoboxData {
  plate: string | null;
  vin: string | null;
  fetched_at: string | null;
  fields: Record<string, unknown>;
}

export function parseAutobox(car: Pick<Car, "autobox_data"> | null | undefined): AutoboxData | null {
  if (!car?.autobox_data) return null;
  try {
    const data = JSON.parse(car.autobox_data) as AutoboxData;
    return data?.fields && typeof data.fields === "object" ? data : null;
  } catch {
    return null;
  }
}

/** Car registry data (autobox.mn) mapped to our ad fields; any field can be null. */
export interface VehicleInfo {
  plate: string | null;
  vin: string | null;
  brand: string | null;
  model: string | null;
  manufactured_year: number | null;
  imported_year: number | null;
  fuel_type: string | null;
  transmission: string | null;
  drive_type: string | null;
  steering: string | null;
  vehicle_type: string | null;
  engine_capacity: number | null;
  mileage: number | null;
  color: string | null;
}

/** `GET /web/cars/vehicle-lookup?plate=1234УБА` (or `?vin=`). */
export async function vehicleLookup(query: { plate?: string; vin?: string }) {
  const params = new URLSearchParams(Object.entries(query).filter(([, v]) => v?.trim()) as [string, string][]);
  const res = await apiFetch<ApiItemResponse<VehicleInfo>>(`/web/cars/vehicle-lookup?${params}`, { auth: false });
  return res.data;
}

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
    vehicle_type: car.vehicle_type,
    engine_capacity: car.engine_capacity,
    color: car.color,
    interior_color: car.interior_color,
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
  // Leftover CUSTOMER rows (web sign-ups) belong on the Хэрэглэгч page, not here.
  const filter: Condition[] = [NOT_DELETED, ["role", "<>", ROLES.customer]];
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
  /** Profile photo file name (uploads/users). */
  profile?: string | null;
  /** ADMIN / DEALER only. */
  dealer_id?: number | null;
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

// --- dealers ---------------------------------------------------------------

const BY_NAME = [{ selector: "name", desc: false }];

/** Every dealer that isn't deleted (the Дилерүүд registry). */
export async function listDealers(search?: string) {
  const filter: Condition[] = [NOT_DELETED];
  const q = search?.trim();
  if (q) filter.push(/^\d+$/.test(q) ? ["phonenumber", "contains", q] : ["name", "contains", q]);
  const res = await apiFetch<ApiListResponse<Dealer>>(`/api/base/dealers${listQuery({ filter, sort: BY_NAME, take: 500 })}`);
  return res.data;
}

/** Active dealers, for assigning an ad or a user to one. */
export async function getDealers() {
  const res = await apiFetch<ApiListResponse<Dealer>>(`/api/base/dealers${listQuery({ filter: [["status", "=", "active"]], sort: BY_NAME, take: 500 })}`);
  return res.data.rows;
}

export async function getDealer(id: number | string) {
  const res = await apiFetch<ApiItemResponse<Dealer | null>>(`/api/base/dealers/${id}`);
  return res.data;
}

export type DealerInput = Pick<Dealer, "name" | "logo" | "phonenumber" | "email" | "address" | "description"> & { status: "active" | "inactive" };

export const createDealer = (body: DealerInput) => createRow("dealers", body);
export const updateDealer = (id: number, body: DealerInput) => updateRow("dealers", id, body);
export const deleteDealer = (id: number) => deleteRows("dealers", [id]);

// --- customers (web visitors) ----------------------------------------------

export async function listCustomers(search?: string, status?: Customer["status"]) {
  const filter: Condition[] = [status ? ["status", "=", status] : NOT_DELETED];
  const q = search?.trim();
  if (q) filter.push(/^\d+$/.test(q) ? ["phonenumber", "contains", q] : q.includes("@") ? ["email", "contains", q] : ["firstname", "contains", q]);
  const res = await apiFetch<ApiListResponse<Customer>>(`/api/base/customers${listQuery({ filter, sort: NEWEST, take: 200 })}`);
  return res.data;
}

export async function getCustomer(id: number | string) {
  const res = await apiFetch<ApiItemResponse<Customer | null>>(`/api/base/customers/${id}`);
  return res.data;
}

export type CustomerInput = Pick<Customer, "firstname" | "lastname" | "phonenumber" | "email"> & { status: "active" | "inactive" };

export const updateCustomer = (id: number, body: CustomerInput) => updateRow("customers", id, body);
export const deleteCustomer = (id: number) => deleteRows("customers", [id]);

// --- web chat messages -----------------------------------------------------

export async function listMessages(status?: Message["status"]) {
  const res = await apiFetch<ApiListResponse<Message>>(
    `/api/base/messages${listQuery({ filter: status ? [["status", "=", status]] : [], sort: [...NEWEST, { selector: "id", desc: true }], take: 200 })}`
  );
  return res.data;
}

export const setMessageStatus = (id: number, status: Message["status"]) => updateRow("messages", id, { status });
export const deleteMessage = (id: number) => deleteRows("messages", [id]);
