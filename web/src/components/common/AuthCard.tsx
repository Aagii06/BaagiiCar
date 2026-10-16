import Logo from "@/components/layout/Logo";

export default function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-md px-4 pt-10 md:pt-16">
      <div className="rounded-3xl bg-card p-6 md:p-8">
        <Logo />
        <h1 className="mt-6 font-display text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
