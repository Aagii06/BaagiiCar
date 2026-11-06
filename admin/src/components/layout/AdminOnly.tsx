"use client";

import { EmptyState } from "@/components/common/States";
import { useAuth } from "@/lib/auth/AuthProvider";
import { ROLES } from "@/lib/constants";
import { tr } from "@/lib/i18n/translations";

/** Admin-only sections (Admin & Dealer, Хэрэглэгч, Дилерүүд). The backend checks the role on every request too. */
export default function AdminOnly({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user?.role !== ROLES.admin) return <EmptyState title={tr("Энэ хэсгийг зөвхөн админ харна")} />;
  return children;
}
