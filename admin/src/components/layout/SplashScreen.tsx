import { tr } from "@/lib/i18n/translations";

/**
 * Full-screen loader shown while the saved session is checked, before either the panel or the login page.
 * The logo sits in a white disc; an orange arc spins around it and a faint inner arc turns the other way.
 */
export default function SplashScreen() {
  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-background"
      role="status"
      aria-label={tr("Ачаалж байна")}
    >
      <div className="relative size-32">
        {/* Outer track + spinning orange arc. */}
        <svg viewBox="0 0 128 128" className="absolute inset-0 size-full animate-splash-spin" aria-hidden>
          <defs>
            <linearGradient id="splash-arc" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0" />
              <stop offset="100%" stopColor="var(--primary)" />
            </linearGradient>
          </defs>
          <circle cx="64" cy="64" r="60" fill="none" stroke="var(--border)" strokeWidth="4" />
          <circle
            cx="64"
            cy="64"
            r="60"
            fill="none"
            stroke="url(#splash-arc)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="120 377"
          />
        </svg>

        {/* Faint inner arc turning the other way. */}
        <svg viewBox="0 0 128 128" className="absolute inset-0 size-full animate-splash-spin-reverse" aria-hidden>
          <circle
            cx="64"
            cy="64"
            r="52"
            fill="none"
            stroke="var(--amber)"
            strokeOpacity="0.55"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="50 277"
          />
        </svg>

        {/* Logo disc. */}
        <div className="absolute inset-[18px] flex items-center justify-center rounded-full bg-card shadow-[0_8px_30px_-8px_rgba(242,106,27,0.35)]">
          {/* eslint-disable-next-line @next/next/no-img-element -- static logo */}
          <img src="/logo.png" alt="" className="w-[70%] animate-splash-breathe select-none" draggable={false} />
        </div>
      </div>
    </div>
  );
}
