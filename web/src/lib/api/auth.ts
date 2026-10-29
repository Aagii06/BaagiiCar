import { ApiError, apiFetch, type ApiItemResponse } from "./client";

type CodeSent = { expires_in?: number; resend_in: number };

/**
 * Asked again before the resend wait is over: the earlier code is still valid, so this counts as sent
 * and the caller just shows the remaining countdown instead of an error.
 */
async function allowCooldown(send: () => Promise<CodeSent>): Promise<CodeSent> {
  try {
    return await send();
  } catch (err) {
    const wait = err instanceof ApiError ? (err.data as { resend_in?: number } | null)?.resend_in : undefined;
    if (typeof wait === "number" && wait > 0) return { resend_in: wait };
    throw err;
  }
}

export interface WebUser {
  id: number;
  phonenumber: string | null;
  firstname: string | null;
  lastname: string | null;
  email: string | null;
  profile: string | null;
  role: string;
  /** When the phone was confirmed by SMS code; null = not yet. */
  phone_verified_at?: string | null;
  /** Unconfirmed accounts are deleted after this time ("YYYY-MM-DD HH:mm:ss", Ulaanbaatar). */
  phone_verify_deadline?: string | null;
}

export interface Session {
  token: string;
  user: WebUser;
}

/** Step 1: texts a 4-digit code (until SMS is connected the backend accepts a fixed code). */
export function sendLoginCode(phonenumber: string) {
  return allowCooldown(async () => {
    const res = await apiFetch<ApiItemResponse<CodeSent>>("/web/auth/otp-send", { method: "POST", body: { phonenumber } });
    return res.data;
  });
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

/** Saves the signed-in user's name; `email: null` removes the e-mail (a new one goes through `sendEmailCode`). Returns the updated profile. */
export async function updateMe(token: string, body: { firstname: string; email?: null }) {
  const res = await apiFetch<ApiItemResponse<WebUser>>("/web/auth/me", {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body,
  });
  return res.data;
}

/** E-mails a 6-digit code to the new address before it replaces the current one. */
export function sendEmailCode(token: string, email: string) {
  return allowCooldown(async () => {
    const res = await apiFetch<ApiItemResponse<CodeSent>>("/web/auth/email-change/send", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: { email },
    });
    return res.data;
  });
}

/** Checks the code and saves the new e-mail; returns the updated profile. */
export async function verifyEmailCode(token: string, email: string, code: string) {
  const res = await apiFetch<ApiItemResponse<WebUser>>("/web/auth/email-change/verify", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: { email, code },
  });
  return res.data;
}

/** Texts a 4-digit code to the account's own phone number. */
export function sendPhoneVerifyCode(token: string) {
  return allowCooldown(async () => {
    const res = await apiFetch<ApiItemResponse<CodeSent>>("/web/auth/phone-verify/send", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  });
}

/** Checks the code and marks the phone as verified; returns the updated profile. */
export async function verifyPhoneCode(token: string, code: string) {
  const res = await apiFetch<ApiItemResponse<WebUser>>("/web/auth/phone-verify/confirm", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: { code },
  });
  return res.data;
}
