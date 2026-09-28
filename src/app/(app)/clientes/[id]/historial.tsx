"use client";

import { useState } from "react";
import { EstadoPill } from "@/components/estado-pill";
import { btnSmCls } from "@/components/form";

export type TurnoHistorial = {
  id: number;
  vehiculoId: number;
  fecha: string;
  estado: string;
  total: string;
  items: { nombre: string; colores: string[] }[];
};

const PAGINA = 6;

/** Etiqueta de un vehículo cuando no hay una tarjeta con el modelo al lado: matrícula, o el
 *  modelo si no tiene, para no mostrar el mismo "Sin matrícula" en más de un vehículo. */
const etiquetaVehiculo = (v: { matricula: string | null; marca_modelo: string }) => v.matricula || v.marca_modelo || "Sin matrícula";

/** Historial del cliente: filtra por vehículo y muestra de a 6 turnos para no alargar la página. */
export function Historial({
  turnos,
  vehiculos,
}: {
  turnos: TurnoHistorial[];
  vehiculos: { id: number; matricula: string | null; marca_modelo: string }[];
}) {
  const [vehiculo, setVehiculo] = useState<number | null>(null);
  const [visibles, setVisibles] = useState(PAGINA);

  const lista = vehiculo === null ? turnos : turnos.filter((t) => t.vehiculoId === vehiculo);
  const etiquetaDe = new Map(vehiculos.map((v) => [v.id, etiquetaVehiculo(v)]));

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg leading-none font-bold tracking-wide uppercase">
          Historial <span className="font-sans text-[13px] font-normal tracking-normal text-muted normal-case tabular-nums">{lista.length} turnos</span>
        </h2>
      </div>

      {vehiculos.length > 1 && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] lg:mx-0 lg:px-0" role="group" aria-label="Filtrar por vehículo">
          <Chip activo={vehiculo === null} onClick={() => { setVehiculo(null); setVisibles(PAGINA); }}>
            Todos
          </Chip>
          {vehiculos.map((v) => (
            <Chip key={v.id} activo={vehiculo === v.id} onClick={() => { setVehiculo(v.id); setVisibles(PAGINA); }}>
              {etiquetaVehiculo(v)}
            </Chip>
          ))}
        </div>
      )}

      {lista.length ? (
        <>
          <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
            {lista.slice(0, visibles).map((t) => (
              <article
                key={t.id}
                className={`flex items-start gap-3 rounded-xl border border-line bg-surface px-3.5 py-3 ${t.estado === "cancelado" ? "opacity-55" : ""}`}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] text-muted">
                    {t.fecha}
                    {vehiculos.length > 1 && <span className="ml-2 font-semibold text-fg">{etiquetaDe.get(t.vehiculoId)}</span>}
                  </p>
                  <ul className="mt-1 flex flex-col gap-0.5 text-sm">
                    {t.items.map((i, n) => (
                      <li key={n} className="flex items-center gap-2">
                        <span className="flex flex-none gap-0.5">
                          {i.colores.map((c, k) => (
                            <span key={k} className="size-[9px] rounded-full" style={{ backgroundColor: c }} />
                          ))}
                        </span>
                        {i.nombre}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className={`font-display text-lg leading-none font-bold tabular-nums ${t.estado === "cancelado" ? "line-through" : ""}`}>{t.total}</span>
                  <EstadoPill estado={t.estado} />
                </div>
              </article>
            ))}
          </div>
          {lista.length > visibles && (
            <button type="button" onClick={() => setVisibles((v) => v + 10)} className={`${btnSmCls} min-h-11 w-full lg:w-auto lg:self-start`}>
              Ver más ({lista.length - visibles} restantes)
            </button>
          )}
          {visibles > PAGINA && lista.length <= visibles && (
            <button type="button" onClick={() => setVisibles(PAGINA)} className={`${btnSmCls} min-h-11 w-full lg:w-auto lg:self-start`}>
              Ver menos
            </button>
          )}
        </>
      ) : (
        <p className="rounded-xl border border-dashed border-line p-4 text-center text-sm text-muted">Sin historial todavía.</p>
      )}
    </section>
  );
}

function Chip({ activo, onClick, children }: { activo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={activo}
      onClick={onClick}
      className="flex-none rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm font-semibold text-muted aria-pressed:border-fg aria-pressed:bg-fg aria-pressed:text-canvas"
    >
      {children}
    </button>
  );
}
