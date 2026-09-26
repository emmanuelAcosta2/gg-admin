export function PageHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h1 className="font-display text-[30px] leading-none font-bold tracking-wide uppercase lg:text-[38px]">
        {title}
      </h1>
      {children}
    </div>
  );
}

export function Placeholder({ paso, children }: { paso: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-line p-6 text-muted">
      <p className="text-[11px] font-semibold tracking-[0.14em] uppercase">{paso}</p>
      <p className="mt-2 max-w-prose">{children}</p>
    </div>
  );
}
