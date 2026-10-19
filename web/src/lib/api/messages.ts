import { apiFetch, type ApiItemResponse } from "./client";

export interface MessageInput {
  name?: string;
  phonenumber: string;
  message: string;
  car_id?: number;
  page_url?: string;
}

/** Visitor's chat message — stored for the admin, who replies by phone. */
export async function sendMessage(input: MessageInput) {
  await apiFetch<ApiItemResponse<{ id: number }>>("/web/messages", { method: "POST", body: input });
}
