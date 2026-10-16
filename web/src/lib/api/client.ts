import { API_BASE_URL } from "./config";
import { clearSession, getAuthToken } from "./token";

/** Fired on `window` when the backend rejects the stored token. */
export const UNAUTHORIZED_EVENT = "web-unauthorized";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export interface ApiItemResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiListResponse<T> {
  success: boolean;
  message: string;
  data: { rows: T[]; count: number };
}

type RequestOptions = Omit<RequestInit, "body"> & {
  /** JSON body, or a FormData for multipart endpoints (`/api/cars/save`). */
  body?: unknown;
  /** Attach the stored bearer token (default `true`). */
  auth?: boolean;
};

function statusMessage(status: number) {
  if (status === 401) return "Нэвтэрнэ үү";
  if (status === 404) return "Хүсэлт олдсонгүй";
  if (status >= 500) return `Серверийн алдаа (${status})`;
  return "Хүсэлт амжилтгүй боллоо";
}

// The car-dealer backend answers both success and failure with HTTP 200 and
// tells them apart via `success`, so that flag is checked with `response.ok`.
export async function apiFetch<T>(
  path: string,
  { body, auth = true, headers, ...options }: RequestOptions = {}
): Promise<T> {
  const requestHeaders = new Headers(headers);
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  if (!isForm && body !== undefined) requestHeaders.set("Content-Type", "application/json");

  if (auth) {
    const token = getAuthToken();
    if (token) requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: requestHeaders,
      body: isForm ? (body as FormData) : body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    if (err instanceof TypeError) throw new ApiError(0, "Сервертэй холбогдож чадсангүй");
    throw err;
  }

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await response.json() : undefined;

  if (!response.ok || data?.success === false) {
    if (auth && response.status === 401) {
      clearSession();
      if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
    }
    // express-validator failures come as `{ type: "validation", errors: [{ field, message }] }`.
    const firstError = Array.isArray(data?.errors) ? data.errors[0]?.message : undefined;
    throw new ApiError(response.status, data?.message || firstError || statusMessage(response.status));
  }

  return data as T;
}

/** A filter condition in the backend's DevExtreme-style format. */
export type Condition = [string, string, unknown];

export interface ListQuery {
  /** Joined with "and". */
  filter?: Condition[];
  sort?: { selector: string; desc: boolean }[];
  take?: number;
  skip?: number;
}

/**
 * Query string for the generic `/base/:target` list endpoints.
 */
export function listQuery({ filter = [], sort, take, skip }: ListQuery = {}) {
  const params = new URLSearchParams();
  if (filter.length === 1) params.set("filter", JSON.stringify(filter[0]));
  else if (filter.length > 1) {
    const joined: unknown[] = [];
    filter.forEach((c, i) => {
      if (i > 0) joined.push("and");
      joined.push(c);
    });
    params.set("filter", JSON.stringify(joined));
  }
  if (sort?.length) params.set("sort", JSON.stringify(sort));
  if (take !== undefined) params.set("take", String(take));
  if (skip !== undefined) params.set("skip", String(skip));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}
