import { apiFetch, type ApiListResponse } from "./client";

/** Public fields of a DEALER account (`GET /web/dealers`). */
export interface Dealer {
  id: number;
  firstname: string | null;
  lastname: string | null;
  phonenumber: string | null;
  /** File name in `uploads/users`. */
  logo: string | null;
  /** Listings currently shown on the site. */
  car_count: number;
}

export async function getDealers() {
  const res = await apiFetch<ApiListResponse<Dealer>>("/web/dealers");
  return res.data;
}
