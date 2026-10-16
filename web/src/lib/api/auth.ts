import { apiFetch, type ApiItemResponse } from "./client";
import type { User } from "./types";

type Session = { token: string; loggedUser: User };

/** Step 1: ask the backend to send a one-time code to this phone. */
export async function sendCode(phonenumber: string) {
  await apiFetch("/api/users/otp-send", { method: "POST", auth: false, body: { phonenumber } });
}

/** Step 2: sign in with the code. An unknown number gets a new account. */
export async function verifyCode(phonenumber: string, code: string) {
  const res = await apiFetch<ApiItemResponse<Session>>("/api/users/otp-login", {
    method: "POST",
    auth: false,
    body: { phonenumber, code },
  });
  return res.data;
}

export async function getUserData() {
  const res = await apiFetch<{ success: boolean; loggedUser: User | null }>("/api/users/get-user-data", {
    method: "POST",
  });
  return res.loggedUser;
}
