import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

/**
 * Numbered circles joined by a line: finished steps get a check and a filled line, the current one is
 * solid brand orange, later ones stay grey. Finished steps are buttons when `onStepClick` is given.
 */
export default function Stepper({ steps, current, onStepClick }: { steps: string[]; current: number; onStepClick?: (index: number) => void }) {
  return (
    <ol className="flex rounded-2xl bg-card px-2 pb-3 pt-4" aria-label="Алхам">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        const clickable = done && !!onStepClick;
        const dot = (
          <span
            className={cn(
              "relative z-10 grid size-8 place-items-center rounded-full border-2 text-sm font-bold transition-colors",
              done && "border-primary bg-primary text-white",
              active && "border-primary bg-primary text-white ring-4 ring-primary/15",
              !done && !active && "border-border bg-white text-muted-foreground"
            )}
          >
            {done ? <Check className="size-4" strokeWidth={3} /> : i + 1}
          </span>
        );
        return (
          <li key={label} className="relative flex flex-1 flex-col items-center" aria-current={active ? "step" : undefined}>
            {/* Line to the previous step, filled once this step is reached. */}
            {i > 0 && <span aria-hidden className={cn("absolute right-1/2 top-4 h-0.5 w-full -translate-y-1/2", i <= current ? "bg-primary" : "bg-border")} />}
            {clickable ? (
              <button type="button" onClick={() => onStepClick(i)} aria-label={`${label} руу буцах`} className="rounded-full">
                {dot}
              </button>
            ) : (
              dot
            )}
            <span className={cn("mt-1.5 text-center text-[11px] font-semibold leading-tight", active ? "text-foreground" : done ? "text-primary" : "text-muted-foreground")}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
