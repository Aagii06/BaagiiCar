import { Phone } from "lucide-react";

/** Call button for the dark dealer hero: glassy pill with a white icon disc. */
export default function DealerPhonePill({ phone }: { phone: string }) {
  return (
    <a
      href={`tel:${phone}`}
      className="group mt-3 inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/10 py-1 pl-1 pr-4 text-sm font-semibold backdrop-blur transition-colors hover:bg-white/20"
    >
      <span className="grid size-7 place-items-center rounded-full bg-white text-primary transition-transform group-hover:scale-105">
        <Phone className="size-3.5" />
      </span>
      {phone}
    </a>
  );
}
