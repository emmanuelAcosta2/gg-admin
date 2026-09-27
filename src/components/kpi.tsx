export function Kpi({ etiqueta, valor, chico, children }: { etiqueta: string; valor: string; chico?: boolean; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-[10px] bg-raised p-3">
      <span className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">{etiqueta}</span>
      <span className="flex items-baseline gap-2">
        <b className={`font-display leading-none tabular-nums ${chico ? "text-lg" : "text-2xl"}`}>{valor}</b>
        {children}
      </span>
    </div>
  );
}
