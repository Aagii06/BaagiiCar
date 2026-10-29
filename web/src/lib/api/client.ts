import type { MessageKey } from "../i18n/messages";
import { documentLocale, translate, type Vars } from "../i18n/translate";
import { API_BASE_URL } from "./config";

/** Fired when a signed-in request comes back 401 (token expired or account removed); the session is dropped. */
export const UNAUTHORIZED_EVENT = "web-unauthorized";

export class ApiError extends Error {
  status: number;
  /** The response's `data`, e.g. `{ resend_in }` when a code was asked for too soon. */
  data: unknown;
  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
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
  /** JSON body. */
  body?: unknown;
};

const tr = (key: MessageKey, vars?: Vars) => translate(documentLocale(), key, vars);

function statusMessage(status: number) {
  if (status === 404) return tr("Хүсэлт олдсонгүй");
  if (status >= 500) return tr("Серверийн алдаа ({status})", { status });
  return tr("Хүсэлт амжилтгүй боллоо");
}

// The car-dealer backend answers both success and failure with HTTP 200 and
// tells them apart via `success`, so that flag is checked with `response.ok`.
export async function apiFetch<T>(
  path: string,
  { body, headers, ...options }: RequestOptions = {}
): Promise<T> {
  const requestHeaders = new Headers(headers);
  if (body !== undefined) requestHeaders.set("Content-Type", "application/json");

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: requestHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    if (err instanceof TypeError) throw new ApiError(0, tr("Сервертэй холбогдож чадсангүй"));
    throw err;
  }

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await response.json() : undefined;

  if (!response.ok || data?.success === false) {
    if (response.status === 401 && requestHeaders.has("Authorization") && typeof window !== "undefined")
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
    // express-validator failures come as `{ type: "validation", errors: [{ field, message }] }`.
    const firstError = Array.isArray(data?.errors) ? data.errors[0]?.message : undefined;
    throw new ApiError(response.status, data?.message || firstError || statusMessage(response.status), data?.data);
  }

  return data as T;
}

/** A filter condition in the backend's DevExtreme-style format. */
export type Condition = [string, string, unknown];
/** Conditions joined by "or" / "and" strings, e.g. `[c1, "or", c2]`. */
export type ConditionGroup = (Condition | "and" | "or")[];

export interface ListQuery {
  /** Joined with "and". */
  filter?: (Condition | ConditionGroup)[];
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
