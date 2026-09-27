/** Compara contra el período anterior: ▲/▼ con el porcentaje, o "sin datos previos" si no hay con qué comparar. */
export function Delta({ actual, anterior }: { actual: number; anterior: number }) {
  if (!anterior) {
    return <span className="rounded-full bg-raised px-2 py-1 text-[12px] font-semibold text-muted">sin datos previos</span>;
  }
  const pct = Math.round(Math.abs((actual - anterior) / anterior) * 100);
  const sube = actual >= anterior;
  return (
    <span className={`rounded-full bg-raised px-2 py-1 text-[12px] leading-none font-semibold tabular-nums ${sube ? "text-ok" : "text-bad"}`}>
      {sube ? "▲" : "▼"} {pct}%
    </span>
  );
}
