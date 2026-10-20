"use client";

import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

/** Pages shown full-width like the public site instead of in the phone column. */
const WIDE = [/^\/cars\/\d+\/view$/];

export const isWidePath = (pathname: string) => WIDE.some((re) => re.test(pathname));

/** Phone-width column like the shop admin; keep max-w-md in sync with PanelShell's bars. */
export default function AppColumn({ children }: { children: React.ReactNode }) {
  const wide = isWidePath(usePathname() ?? "/");
  return <div className={cn("relative mx-auto min-h-screen w-full bg-background", wide ? "" : "max-w-md sm:shadow-xl")}>{children}</div>;
}
