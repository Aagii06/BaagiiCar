import { apiFetch, type ApiItemResponse, type ApiListResponse } from "./client";
import type { Car } from "./types";

/** Public fields of a registered dealer (`GET /web/dealers`). */
export interface Dealer {
  id: number;
  name: string | null;
  phonenumber: string | null;
  /** File name in `uploads/dealers`. */
  logo: string | null;
  /** Only on `GET /web/dealers/:id`. */
  address?: string | null;
  /** Listings of the dealer currently shown on the site. */
  car_count: number;
}

export function dealerName(dealer: Dealer) {
  return dealer.name ?? "";
}

/** Most listings first, then by name. */
export async function getDealers() {
  const res = await apiFetch<ApiListResponse<Dealer>>("/web/dealers");
  const rows = [...res.data.rows].sort((a, b) => b.car_count - a.car_count || dealerName(a).localeCompare(dealerName(b)));
  return { ...res.data, rows };
}

export async function getDealer(id: number) {
  const res = await apiFetch<ApiItemResponse<Dealer>>(`/web/dealers/${id}`);
  return res.data;
}

/** Active ads of the dealer, newest first. */
export async function getDealerCars(id: number, page = 1, pageSize = 12) {
  const res = await apiFetch<ApiListResponse<Car>>(`/web/dealers/${id}/cars?take=${pageSize}&skip=${(page - 1) * pageSize}`);
  return res.data;
}
