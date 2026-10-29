import { apiFetch, type ApiItemResponse } from "./client";

export interface FeedbackInput {
  name: string;
  phonenumber: string;
  email: string;
  message: string;
}

/** "Бидэнд бичих" form; lands in the admin panel under Профайл → Санал хүсэлт. */
export async function sendFeedback(input: FeedbackInput, token?: string | null) {
  await apiFetch<ApiItemResponse<null>>("/web/feedbacks", {
    method: "POST",
    body: input,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}
