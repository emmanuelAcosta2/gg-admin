"use client";

import { useActionState, useEffect, useState } from "react";
import { btnPrimaryCls, Field, FormError, inputCls } from "@/components/form";
import type { TurnoVista } from "@/lib/agenda";
import { MEDIOS_PAGO, TAMANOS, type Tamano } from "@/lib/dominio";
import { formatPesos } from "@/lib/format";
import { guardarTurno, type FormState } from "./actions";
import { useCatalogo } from "./catalogo";

type ItemForm = {
  clave: string;
  tipo: "servicio" | "combo";
  refId: number;
  nombre: string;
  colores: string[];
  precio: string;
  referencia: number | null;
  nota: string;
};

const Puntos = ({ colores }: { colores: string[] }) => (
  <span className="flex flex-none gap-0.5">
    {colores.map((c, i) => (
      <span key={i} className="size-[9px] rounded-full" style={{ backgroundColor: c }} />
    ))}
  </span>
);

export function TurnoForm({ turno, fecha, close }: { turno?: TurnoVista; fecha?: string; close: () => void }) {
  const cat = useCatalogo();
  const [state, action, pending] = useActionState<FormState, FormData>(guardarTurno, {});
  useEffect(() => {
    if (state.ok) close();
  }, [state, close]);

  const [vehiculoId, setVehiculoId] = useState(turno?.vehiculo.id ?? cat.vehiculos[0]?.id ?? 0);
  const [items, setItems] = useState<ItemForm[]>(() =>
    (turno?.items ?? []).map((i, n) => ({
      clave: `e${n}`,
      tipo: i.tipo,
      refId: i.refId,
      nombre: i.nombre,
      colores: i.colores,
      precio: String(i.precio),
      referencia: i.referencia,
      nota: i.nota ?? "",
    })),
  );

  const vehiculo = cat.vehiculos.find((v) => v.id === vehiculoId);
  const total = items.reduce((s, i) => s + (Number(i.precio) || 0), 0);

  const agregar = (i: Omit<ItemForm, "clave" | "nota" | "precio"> & { precio: number | null }) =>
    setItems((prev) => [...prev, { ...i, clave: `n${Date.now()}${prev.length}`, precio: String(i.precio ?? ""), nota: "" }]);
  const cambiar = (clave: string, parcial: Partial<ItemForm>) =>
    setItems((prev) => prev.map((i) => (i.clave === clave ? { ...i, ...parcial } : i)));

  const payload = JSON.stringify(
    items.map((i) => ({ tipo: i.tipo, refId: i.refId, precio: Number(i.precio), nota: i.nota })),
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      {turno && <input type="hidden" name="id" value={turno.id} />}
      <input type="hidden" name="items" value={payload} />

      <Field label="Vehículo" htmlFor="t-veh" hint={vehiculo ? `Tamaño: ${TAMANOS[vehiculo.tamano as Tamano] ?? vehiculo.tamano}. ¿Cliente nuevo? Crealo primero en Clientes.` : undefined}>
        <select id="t-veh" name="vehiculo_id" value={vehiculoId} onChange={(e) => setVehiculoId(Number(e.target.value))} className={inputCls}>
          {cat.vehiculos.map((v) => (
            <option key={v.id} value={v.id}>
              {v.matricula} · {v.modelo || "Sin modelo"} — {v.cliente}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Fecha" htmlFor="t-fecha">
          <input id="t-fecha" name="fecha" type="date" required defaultValue={turno?.dia ?? fecha ?? cat.hoy} className={inputCls} />
        </Field>
        <Field label="Hora" htmlFor="t-hora">
          <input id="t-hora" name="hora" type="time" required step={300} defaultValue={turno?.hora ?? "16:00"} className={inputCls} />
        </Field>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">Servicios</span>
        {items.length === 0 && (
          <p className="rounded-xl border border-dashed border-line p-4 text-center text-sm text-muted">Agregá al menos un servicio o combo.</p>
        )}
        {items.map((i) => {
          const difiere = i.referencia !== null && Number(i.precio) !== i.referencia;
          return (
            <div key={i.clave} className="flex flex-col gap-2.5 rounded-xl border border-line bg-raised p-3">
              <div className="flex items-center gap-2">
                <Puntos colores={i.colores} />
                <b className="min-w-0 flex-1 truncate">{i.nombre}</b>
                <button
                  type="button"
                  onClick={() => setItems((prev) => prev.filter((x) => x.clave !== i.clave))}
                  className="min-h-9 rounded-[10px] border border-line bg-surface px-3 text-sm font-semibold"
                  aria-label={`Quitar ${i.nombre}`}
                >
                  Quitar
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex-1 text-[13px] text-muted tabular-nums">
                  {i.referencia !== null ? `Referencia ${formatPesos(i.referencia)}` : "Sin precio de referencia"}
                </span>
                <label htmlFor={`p-${i.clave}`} className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">
                  Cobrado $
                </label>
                <input
                  id={`p-${i.clave}`}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  required
                  value={i.precio}
                  onChange={(e) => cambiar(i.clave, { precio: e.target.value })}
                  className={`${inputCls} max-w-[130px] text-right font-display text-xl font-bold tabular-nums`}
                />
              </div>
              {difiere && (
                <Field label="Nota del ajuste" htmlFor={`n-${i.clave}`}>
                  <input
                    id={`n-${i.clave}`}
                    value={i.nota}
                    onChange={(e) => cambiar(i.clave, { nota: e.target.value })}
                    placeholder="Ej: camioneta, suciedad extra, descuento"
                    className={inputCls}
                  />
                </Field>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">Agregar servicio suelto</span>
        <div className="flex flex-wrap gap-2">
          {cat.categorias.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => agregar({ tipo: "servicio", refId: c.id, nombre: c.nombre, colores: [c.color], precio: c.precio, referencia: c.precio })}
              className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm font-semibold"
            >
              <Puntos colores={[c.color]} /> {c.nombre}
            </button>
          ))}
        </div>
        {cat.combos.length > 0 && (
          <>
            <span className="mt-1 text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">Agregar combo</span>
            <div className="flex flex-wrap gap-2">
              {cat.combos.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => agregar({ tipo: "combo", refId: c.id, nombre: c.nombre, colores: c.colores, precio: c.precio, referencia: c.precio })}
                  className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm font-semibold"
                >
                  <Puntos colores={c.colores} /> {c.nombre}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <Field label="Medio de pago" htmlFor="t-pago" hint="Se puede dejar sin definir y elegirlo al marcar el turno como realizado.">
        <select id="t-pago" name="medio_pago" defaultValue={turno?.medioPago ?? ""} className={inputCls}>
          <option value="">Sin definir</option>
          {Object.entries(MEDIOS_PAGO).map(([k, l]) => (
            <option key={k} value={k}>
              {l}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Notas" htmlFor="t-notas">
        <textarea id="t-notas" name="notas" rows={2} defaultValue={turno?.notas ?? ""} placeholder="Ej: dejó las llaves en recepción" className={`${inputCls} min-h-16`} />
      </Field>

      <div className="flex items-baseline justify-between">
        <span className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">Total</span>
        <span className="font-display text-[44px] leading-none font-bold tabular-nums">{formatPesos(total)}</span>
      </div>

      <FormError message={state.error} />
      <button disabled={pending} className={btnPrimaryCls}>
        {pending ? "Guardando…" : turno ? "Guardar cambios" : "Agendar turno"}
      </button>
    </form>
  );
}
