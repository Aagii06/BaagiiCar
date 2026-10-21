"use client";

import { usePathname } from "next/navigation";

/**
 * The `[id]` of /cars/[id], /cars/[id]/view and /users/[id].
 *
 * The static export builds each of those routes once, for the placeholder id
 * "_" (see their layout.tsx), and nginx serves that one HTML file for every id.
 * useParams() would report the placeholder, so read the real id from the URL.
 */
export function useRouteId() {
  return decodeURIComponent(usePathname().split("/")[2] ?? "");
}
