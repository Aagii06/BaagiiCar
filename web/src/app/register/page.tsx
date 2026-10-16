import { redirect } from "next/navigation";

// Sign-up happens on the login page: a new phone number is registered when its code is confirmed.
export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  redirect(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
}
