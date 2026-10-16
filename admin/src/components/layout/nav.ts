import { CarFront, ChartNoAxesColumn, LibraryBig, UserRound, Users, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Самбар", icon: ChartNoAxesColumn },
  { href: "/cars", label: "Зарууд", icon: CarFront },
  { href: "/catalog", label: "Каталог", icon: LibraryBig },
  { href: "/users", label: "Хэрэглэгч", icon: Users },
  { href: "/profile", label: "Профайл", icon: UserRound },
];

export function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
