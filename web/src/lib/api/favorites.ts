import { apiFetch, type ApiItemResponse } from "./client";

/** The signed-in visitor's saved ad ids, newest first. */
export async function getFavoriteIds(token: string) {
  const res = await apiFetch<ApiItemResponse<number[]>>("/web/favorites", { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
}

/** Saves ads to the account (one heart, or the list made before signing in); returns every saved id. */
export async function addFavorites(carIds: number[], token: string) {
  const res = await apiFetch<ApiItemResponse<number[]>>("/web/favorites", {
    method: "POST",
    body: { car_ids: carIds },
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function removeFavorite(carId: number, token: string) {
  await apiFetch(`/web/favorites/${carId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
}
