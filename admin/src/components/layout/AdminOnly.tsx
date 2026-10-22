"use client";

import { EmptyState } from "@/components/common/States";
import { useAuth } from "@/lib/auth/AuthProvider";
import { ROLES } from "@/lib/constants";

/** Admin-only sections (Admin & Dealer, Хэрэглэгч, Дилерүүд). The backend checks the role on every request too. */
export default function AdminOnly({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user?.role !== ROLES.admin) return <EmptyState title="Энэ хэсгийг зөвхөн админ харна" />;
  return children;
}
