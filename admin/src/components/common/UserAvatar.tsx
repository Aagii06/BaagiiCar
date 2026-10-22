import { catalogImage } from "@/lib/api/config";
import type { User } from "@/lib/api/types";
import { cn, initials, userName } from "@/lib/utils";

/** Profile photo (uploads/users), else initials. */
export default function UserAvatar({ user, className = "size-10" }: { user: User | null | undefined; className?: string }) {
  const photo = catalogImage(user?.profile, "users");
  return photo ? (
    // eslint-disable-next-line @next/next/no-img-element -- uploaded profile photo
    <img src={photo} alt="" className={cn("shrink-0 rounded-full bg-muted object-cover", className)} />
  ) : (
    <span className={cn("grid shrink-0 place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary", className)}>{initials(userName(user ?? null))}</span>
  );
}
