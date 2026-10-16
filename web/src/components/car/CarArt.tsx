import { cn } from "@/lib/utils";

type Shape = "sedan" | "suv" | "hatch" | "pickup" | "coupe";

// Outline drawn in a 120×50 box with wheels at x=30/90 on y=40. The body
// stops short of the wheels so they read as open circles on any tint.
const BODY: Record<Shape, { outline: string; window: string }> = {
  sedan: {
    outline:
      "M23 40H12q-4 0-4-4v-5q0-4 5-5l20-3 13-10q2-1 5-1h25q3 0 5 2l11 9 15 3q5 1 5 6v4q0 4-4 4h-11M37 40h46",
    window: "M37 23l11-8h27l9 8z",
  },
  suv: {
    outline:
      "M23 40H12q-4 0-4-4v-9q0-3 4-4l14-2 10-11q2-1 5-1h47q4 0 6 3l10 10 4 1q4 1 4 5v8q0 4-4 4h-11M37 40h46",
    window: "M30 21l9-9h49l8 9z",
  },
  hatch: {
    outline:
      "M23 40H12q-4 0-4-4v-5q0-4 5-5l17-3 14-10q2-1 5-1h43q4 0 6 3l8 11q6 1 6 6v4q0 4-4 4h-11M37 40h46",
    window: "M34 23l12-8h46l7 8z",
  },
  pickup: {
    outline:
      "M23 40H12q-4 0-4-4v-6q0-4 5-5l15-2 12-11q2-1 5-1h21q3 0 3 3v10h39q4 0 4 4v8q0 4-4 4h-11M37 40h46",
    window: "M33 23l11-9h21v9z",
  },
  coupe: {
    outline:
      "M23 40H12q-4 0-4-4v-4q0-4 5-5l23-3 16-9q3-1 6-1h16q4 0 7 3l9 7 17 3q5 1 5 6v3q0 4-4 4h-11M37 40h46",
    window: "M41 24l13-7h20l10 7z",
  },
};

export function shapeFor(bodyType: string | null | undefined): Shape {
  const n = (bodyType ?? "").toLowerCase();
  if (/suv|van|wagon|жийп|микро/.test(n)) return "suv";
  if (/hatch|хэтч/.test(n)) return "hatch";
  if (/pickup|пикап/.test(n)) return "pickup";
  if (/coupe|convertible|купе|кабри/.test(n)) return "coupe";
  return "sedan";
}

export default function CarArt({
  shape = "sedan",
  className,
  strokeWidth = 2.2,
}: {
  shape?: Shape;
  className?: string;
  strokeWidth?: number;
}) {
  const body = BODY[shape];
  return (
    <svg
      viewBox="0 0 120 50"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("text-foreground", className)}
      aria-hidden
    >
      <path d={body.outline} />
      <path d={body.window} />
      <circle cx="30" cy="40" r="7" />
      <circle cx="90" cy="40" r="7" />
    </svg>
  );
}
