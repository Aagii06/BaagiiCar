/** Login / register card. The brand is already in the header, so the card starts with the title. */
export default function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-md px-4 pt-10 md:pt-16">
      <div className="rounded-3xl bg-card p-6 shadow-xl shadow-black/5 md:p-8">
        <h1 className="font-display text-3xl font-bold">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
