import { CarFront, ChartNoAxesColumn, MessageCircle, UserRound, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Hidden from dealers. */
  adminOnly?: boolean;
  /** Button on the right of the top app bar while this tab is open. */
  action?: { href: string; label: string };
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Самбар", icon: ChartNoAxesColumn },
  { href: "/cars", label: "Зарууд", icon: CarFront, action: { href: "/cars/new", label: "Зар нэмэх" } },
  // Dealers see messages about their own dealer's ads (the backend scopes them).
  { href: "/messages", label: "Мессеж", icon: MessageCircle },
  { href: "/profile", label: "Профайл", icon: UserRound },
];

export function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
