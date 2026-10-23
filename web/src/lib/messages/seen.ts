import type { MyMessage } from "@/lib/api/messages";

/**
 * Which team answers the visitor has already opened, kept in this browser per user
 * (the backend has no read flag). Unread = has a reply whose message id is not in the set.
 */
const key = (userId: number) => `baagii_car_seen_replies_${userId}`;

export function readSeen(userId: number): Set<number> {
  try {
    const raw = JSON.parse(localStorage.getItem(key(userId)) ?? "[]");
    return new Set(Array.isArray(raw) ? raw.filter((n): n is number => Number.isInteger(n)) : []);
  } catch {
    return new Set();
  }
}

export function markSeen(userId: number, messages: MyMessage[]) {
  const seen = readSeen(userId);
  const before = seen.size;
  for (const m of messages) if (m.reply) seen.add(m.id);
  if (seen.size === before) return;
  try {
    localStorage.setItem(key(userId), JSON.stringify([...seen]));
  } catch {
    // storage blocked — the badge just stays
  }
}

export function unreadCount(messages: MyMessage[], seen: Set<number>) {
  return messages.filter((m) => m.reply && !seen.has(m.id)).length;
}
