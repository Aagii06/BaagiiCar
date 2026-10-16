import { apiFetch, type ApiItemResponse } from "./client";
import type { User } from "./types";

type Session = { token: string; loggedUser: User };

export async function login(phonenumber: string, password: string) {
  const res = await apiFetch<ApiItemResponse<Session>>("/api/users/login", {
    method: "POST",
    auth: false,
    body: { phonenumber, password },
  });
  return res.data;
}

export interface RegisterInput {
  phonenumber: string;
  firstname: string;
  lastname?: string;
  email?: string;
  password: string;
  password_confirm: string;
}

export async function register(input: RegisterInput) {
  const res = await apiFetch<ApiItemResponse<Session>>("/api/users/register", {
    method: "POST",
    auth: false,
    body: input,
  });
  return res.data;
}

export async function getUserData() {
  const res = await apiFetch<{ success: boolean; loggedUser: User | null }>("/api/users/get-user-data", {
    method: "POST",
  });
  return res.loggedUser;
}
