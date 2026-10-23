import Img from "@/components/common/Img";
import { catalogImage } from "@/lib/api/config";
import type { Customer } from "@/lib/api/types";
import { initials } from "@/lib/utils";

export const customerName = (c: Pick<Customer, "firstname" | "lastname" | "phonenumber" | "email">) =>
  [c.lastname, c.firstname].filter(Boolean).join(" ") || c.phonenumber || c.email || "Нэргүй";

export function CustomerAvatar({ customer, className = "size-10" }: { customer: Customer; className?: string }) {
  const photo = catalogImage(customer.profile, "users");
  return (
    <Img
      src={photo}
      className={`${className} shrink-0 rounded-full bg-muted object-cover`}
      fallback={<span className={`${className} grid shrink-0 place-items-center rounded-full bg-muted text-sm font-bold`}>{initials(customerName(customer))}</span>}
    />
  );
}
