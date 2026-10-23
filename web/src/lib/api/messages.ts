import { apiFetch, type ApiItemResponse, type ApiListResponse } from "./client";

export interface MessageInput {
  /** "car": about ads (the only kind until the AI assistant is connected). */
  type?: "car";
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

export interface MyMessage {
  id: number;
  type: string | null;
  message: string;
  /** The team's / dealer's answer, shown in the thread. */
  reply: string | null;
  replied_at: string | null;
  car_id: number | null;
  /** "new" until the team marks it "done". */
  status: string | null;
  created_at: string | null;
}

/** The signed-in visitor's own messages, newest first. */
export async function getMyMessages(token: string) {
  const res = await apiFetch<ApiListResponse<MyMessage>>("/web/messages", { headers: { Authorization: `Bearer ${token}` } });
  return res.data.rows;
}
