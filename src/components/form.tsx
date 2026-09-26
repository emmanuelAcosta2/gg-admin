import type { ReactNode } from "react";

export const inputCls =
  "min-h-11 w-full rounded-[10px] border border-line bg-raised px-3 py-2.5 text-fg placeholder:text-muted";

export const btnCls =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] border border-line bg-raised px-[18px] font-semibold";

export const btnPrimaryCls =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] border border-brand bg-brand px-[18px] font-semibold text-brand-ink disabled:opacity-60";

export const btnSmCls =
  "inline-flex min-h-9 items-center justify-center rounded-[10px] border border-line bg-raised px-3 text-sm font-semibold";

export function Field({ label, htmlFor, hint, children }: { label: string; htmlFor?: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">
        {label}
      </label>
      {children}
      {hint && <p className="text-[13px] text-muted">{hint}</p>}
    </div>
  );
}

export function FormError({ message }: { message?: string }) {
  return message ? (
    <p role="alert" className="text-sm text-bad">
      {message}
    </p>
  ) : null;
}
