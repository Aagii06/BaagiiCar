import { apiFetch, type ApiItemResponse } from "./client";

export interface MessageInput {
  message: string;
  car_id?: number;
  page_url?: string;
}

/** Signed-in visitor's chat message — stored for the admin, who replies by phone. Name and number come from the token. */
export async function sendMessage(input: MessageInput, token: string) {
  await apiFetch<ApiItemResponse<{ id: number }>>("/web/messages", {
    method: "POST",
    body: input,
    headers: { Authorization: `Bearer ${token}` },
  });
}
