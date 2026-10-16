import type { Car } from "@/lib/api/types";
import { cn, formatEngine, formatNumber } from "@/lib/utils";
import { Fuel, Gauge, Milestone, Zap } from "lucide-react";

/** The four little spec tiles on every card: mileage, fuel, engine, drive. */
export default function SpecChips({ car, className }: { car: Car; className?: string }) {
  const items = [
    { icon: Milestone, label: car.mileage != null ? formatNumber(car.mileage) : "—", title: "Гүйлт (км)" },
    { icon: Fuel, label: car.fuel_type || "—", title: "Түлш" },
    { icon: Zap, label: formatEngine(car.engine_capacity), title: "Хөдөлгүүр" },
    { icon: Gauge, label: car.drive_type || "—", title: "Хөтлөгч" },
  ];
  return (
    <div className={cn("grid grid-cols-4 gap-1.5", className)}>
      {items.map(({ icon: Icon, label, title }) => (
        <div key={title} title={title} className="min-w-0 rounded-lg bg-muted px-2 py-2">
          <Icon className="size-3.5 text-foreground/70" />
          <p className="mt-1.5 truncate text-[11px] font-semibold">{label}</p>
        </div>
      ))}
    </div>
  );
}
