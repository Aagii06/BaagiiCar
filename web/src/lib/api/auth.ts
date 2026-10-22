import { apiFetch, type ApiItemResponse } from "./client";

export interface WebUser {
  id: number;
  phonenumber: string | null;
  firstname: string | null;
  lastname: string | null;
  email: string | null;
  profile: string | null;
  role: string;
}

export interface Session {
  token: string;
  user: WebUser;
}

/** Step 1: texts a 4-digit code (until SMS is connected the backend accepts a fixed code). */
export async function sendLoginCode(phonenumber: string) {
  const res = await apiFetch<ApiItemResponse<{ expires_in: number; resend_in: number }>>("/web/auth/otp-send", {
    method: "POST",
    body: { phonenumber },
  });
  return res.data;
}

/** Step 2: checks the code; an unknown number is registered on the spot. */
export async function loginWithCode(phonenumber: string, code: string): Promise<Session> {
  const res = await apiFetch<ApiItemResponse<{ token: string; loggedUser: WebUser }>>("/web/auth/otp-login", {
    method: "POST",
    body: { phonenumber, code },
  });
  return { token: res.data.token, user: res.data.loggedUser };
}

/** Fresh profile for a stored token; throws ApiError(401) once the token or account is no longer valid. */
export async function getMe(token: string) {
  const res = await apiFetch<ApiItemResponse<WebUser>>("/web/auth/me", { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
}
