import { apiFetch, type ApiItemResponse } from "./client";

// Dealer wallet and the admin's payment settings (backend api/payments).

export interface BankAccount {
  bank_name: string;
  account_name: string;
  account_number: string;
  iban: string | null;
}

/** What the renew button and the dealer's wallet need: price, ways to pay, the dealer's balance. */
export interface PaymentInfo {
  renew_price: number;
  renew_days: number;
  bank: BankAccount | null;
  qpay: boolean;
  dealer_id: number | null;
  /** The signed-in dealer's balance; null for admins. */
  balance: number | null;
}

export interface PaymentSettings {
  renew_price: number;
  bank: { enabled: boolean; bank_name: string; account_name: string; account_number: string; iban: string };
  qpay: { enabled: boolean; sandbox: boolean; username: string; has_password: boolean; invoice_code: string };
}

export type PaymentSettingsInput = Omit<PaymentSettings, "qpay"> & {
  qpay: Omit<PaymentSettings["qpay"], "has_password"> & { password: string };
};

export type TxType = "topup" | "renew" | "adjust";
export type TxStatus = "pending" | "done" | "rejected";

export interface Transaction {
  id: number;
  dealer_id: number;
  dealer_name: string | null;
  dealer_logo: string | null;
  type: TxType;
  method: "qpay" | "bank" | "balance" | "admin";
  /** Money in (+) or out (-). */
  amount: number;
  status: TxStatus;
  car_id: number | null;
  car_code: string | null;
  note: string | null;
  reject_reason: string | null;
  created_by_name: string | null;
  created_at: string;
}

export interface DealerBalance {
  id: number;
  name: string;
  logo: string | null;
  status: string;
  balance: number;
  /** Everything that came in (top-ups, admin additions). */
  total_in: number;
  /** Everything spent (renewals, deductions), as a positive number. */
  total_out: number;
  /** Bank top-ups waiting for the admin. */
  pending: number;
}

export interface QpayInvoice {
  id: number;
  amount: number;
  qr_text: string;
  qr_image: string;
  short_url: string | null;
  urls: { name: string; description: string; logo: string; link: string }[];
  paid: boolean;
}

export async function getPaymentInfo() {
  return (await apiFetch<ApiItemResponse<PaymentInfo>>("/api/payments/info")).data;
}

export async function getPaymentSettings() {
  return (await apiFetch<ApiItemResponse<PaymentSettings>>("/api/payments/settings")).data;
}

export async function savePaymentSettings(body: PaymentSettingsInput) {
  return (await apiFetch<ApiItemResponse<PaymentSettings>>("/api/payments/settings", { method: "PUT", body })).data;
}

export async function listTransactions(query: { dealer_id?: number; status?: TxStatus; limit?: number; offset?: number } = {}) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) if (v !== undefined) params.set(k, String(v));
  const qs = params.toString();
  return (await apiFetch<ApiItemResponse<{ rows: Transaction[]; count: number }>>(`/api/payments/transactions${qs ? `?${qs}` : ""}`)).data;
}

export async function getDealerBalances() {
  return (await apiFetch<ApiItemResponse<DealerBalance[]>>("/api/payments/balances")).data;
}

/** A dealer tops up their own balance; an admin passes `dealerId` to bill that dealer. */
export async function createTopupInvoice(amount: number, dealerId?: number) {
  return (await apiFetch<ApiItemResponse<QpayInvoice>>("/api/payments/topup/qpay", { method: "POST", body: { amount, dealer_id: dealerId } })).data;
}

export async function checkTopupInvoice(id: number) {
  return (await apiFetch<ApiItemResponse<{ paid: boolean; balance: number }>>("/api/payments/topup/qpay/check", { method: "POST", body: { id } })).data;
}

export async function requestBankTopup(amount: number, note: string) {
  await apiFetch("/api/payments/topup/bank", { method: "POST", body: { amount, note } });
}

export async function approveTopup(id: number) {
  await apiFetch("/api/payments/transactions/approve", { method: "POST", body: { id } });
}

export async function rejectTopup(id: number, reason: string) {
  await apiFetch("/api/payments/transactions/reject", { method: "POST", body: { id, reason } });
}

export async function adjustBalance(dealer_id: number, amount: number, note: string) {
  await apiFetch("/api/payments/adjust", { method: "POST", body: { dealer_id, amount, note } });
}
