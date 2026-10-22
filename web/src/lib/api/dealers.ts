import { apiFetch, type ApiItemResponse, type ApiListResponse } from "./client";
import type { Car } from "./types";

/** Public fields of a DEALER account (`GET /web/dealers`). */
export interface Dealer {
  id: number;
  firstname: string | null;
  lastname: string | null;
  phonenumber: string | null;
  /** File name in `uploads/users`. */
  logo: string | null;
  /** Listings currently shown on the site (owned by or posted by the dealer). */
  car_count: number;
}

export function dealerName(dealer: Dealer) {
  // Дилерт овог байдаггүй: [dealer.firstname, dealer.lastname].filter(Boolean).join(" ")
  return dealer.firstname ?? "";
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

/** Active ads that belong to the dealer or that the dealer posted, newest first. */
export async function getDealerCars(id: number, page = 1, pageSize = 12) {
  const res = await apiFetch<ApiListResponse<Car>>(`/web/dealers/${id}/cars?take=${pageSize}&skip=${(page - 1) * pageSize}`);
  return res.data;
}
