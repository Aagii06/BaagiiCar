import { apiFetch, type ApiItemResponse } from "./client";

type EmailStatus = { status: "pending" | "active"; expires_in?: number; resend_in?: number };

/** Step 1: emails a 6-digit code (or reports the address is already active). */
export async function subscribeEmail(email: string) {
  const res = await apiFetch<ApiItemResponse<EmailStatus>>("/web/subscriptions/email", { method: "POST", body: { email } });
  return res.data;
}

/** Step 2: confirms the code; new-listing digests start after this. */
export async function verifyEmail(email: string, code: string) {
  await apiFetch("/web/subscriptions/email/verify", { method: "POST", body: { email, code } });
}

export async function unsubscribe(token: string) {
  const res = await apiFetch<ApiItemResponse<null>>("/web/subscriptions/unsubscribe", { method: "POST", body: { token } });
  return res.message;
}

export async function getPushKey() {
  const res = await apiFetch<ApiItemResponse<{ publicKey: string | null }>>("/web/subscriptions/push-key");
  return res.data.publicKey;
}

export async function subscribePush(subscription: PushSubscriptionJSON) {
  await apiFetch("/web/subscriptions/push", { method: "POST", body: subscription });
}

export async function unsubscribePush(endpoint: string) {
  await apiFetch("/web/subscriptions/push/unsubscribe", { method: "POST", body: { endpoint } });
}
