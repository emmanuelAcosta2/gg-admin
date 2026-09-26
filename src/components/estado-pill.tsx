import { ESTADOS, type Estado } from "@/lib/dominio";

const COLOR: Record<Estado, string> = {
  agendado: "border-brand/50 text-brand",
  realizado: "border-ok/50 text-ok",
  cancelado: "border-line text-muted",
};

export function EstadoPill({ estado }: { estado: string }) {
  const e = estado as Estado;
  return (
    <span className={`rounded-full border px-2 py-1 text-[11px] leading-none font-semibold tracking-[0.06em] whitespace-nowrap uppercase ${COLOR[e] ?? COLOR.cancelado}`}>
      {ESTADOS[e] ?? estado}
    </span>
  );
}
