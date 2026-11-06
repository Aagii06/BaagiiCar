import { CarFront, ChartNoAxesColumn, MessageCircle, UserRound, type LucideIcon } from "lucide-react";
import { tr } from "@/lib/i18n/translations";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Hidden from dealers. */
  adminOnly?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: tr("Самбар"), icon: ChartNoAxesColumn },
  { href: "/cars", label: tr("Зарууд"), icon: CarFront },
  // Dealers see messages about their own dealer's ads (the backend scopes them).
  { href: "/messages", label: tr("Мессеж"), icon: MessageCircle },
  { href: "/profile", label: tr("Профайл"), icon: UserRound },
];

export function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
