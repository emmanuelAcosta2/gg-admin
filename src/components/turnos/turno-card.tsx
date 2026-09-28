"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { EstadoPill } from "@/components/estado-pill";
import { btnPrimaryCls, btnSmCls, FormError, inputCls } from "@/components/form";
import { Modal } from "@/components/modal";
import { coloresDelTurno, type TurnoVista } from "@/lib/agenda";
import { iniciales, MEDIOS_PAGO, TAMANOS, type Tamano } from "@/lib/dominio";
import { formatPesos } from "@/lib/format";
import { cambiarEstado, type CambioEstado } from "./actions";
import { TurnoForm } from "./turno-form";

const Franja = ({ turno, horizontal }: { turno: TurnoVista; horizontal?: boolean }) => (
  <span
    aria-hidden="true"
    className={`flex flex-none gap-0.5 overflow-hidden rounded-[3px] ${horizontal ? "h-1.5 w-[34px]" : "w-1.5 flex-col self-stretch"}`}
  >
    {coloresDelTurno(turno).map((c) => (
      <i key={c} className="flex-1" style={{ backgroundColor: c }} />
    ))}
  </span>
);

const resumen = (t: TurnoVista) => t.items.map((i) => i.nombre).join(" · ");

/** Cuando la matrícula es el único texto que identifica al vehículo (título del modal, fila
 *  compacta), se usa el modelo como respaldo antes de caer a un genérico. */
const identificarVehiculo = (v: TurnoVista["vehiculo"]) => v.matricula || v.modelo || "Vehículo";

/** Turno en la agenda: al tocarlo abre el detalle con las acciones. `fila` es la versión compacta de la vista semanal. */
export function TurnoCard({ turno, fila }: { turno: TurnoVista; fila?: boolean }) {
  const cancelado = turno.estado === "cancelado";

  return (
    <Modal
      title={identificarVehiculo(turno.vehiculo)}
      triggerClassName={
        fila
          ? `flex w-full min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5 rounded-[10px] border border-line bg-raised px-2.5 py-2 text-left lg:bg-raised ${cancelado ? "opacity-50" : ""}`
          : `flex w-full min-w-0 gap-3 rounded-xl border border-line bg-surface py-3 pr-3.5 pl-3 text-left ${cancelado ? "opacity-55" : ""}`
      }
      trigger={
        fila ? (
          <>
            <span className="font-display text-base leading-none font-bold tabular-nums">{turno.hora}</span>
            <Franja turno={turno} horizontal />
            <span className="ml-auto text-[13px] leading-none">{turno.estado === "agendado" ? "●" : turno.estado === "realizado" ? "✓" : "✕"}</span>
            <span className="basis-full text-[12px] leading-snug text-muted lg:basis-full">
              <b className="text-fg">{identificarVehiculo(turno.vehiculo)}</b> · {resumen(turno)}
            </span>
          </>
        ) : (
          <>
            <span className="w-[72px] flex-none pt-0.5 font-display text-[22px] leading-none font-bold tabular-nums">{turno.hora}</span>
            <Franja turno={turno} />
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="font-display text-[17px] leading-none font-bold tracking-wide uppercase">{turno.vehiculo.matricula || "Sin matrícula"}</span>
              <span className="truncate text-[13px] text-muted">
                {turno.vehiculo.modelo} · {turno.cliente.nombre}
              </span>
              <span className="text-[13px] opacity-90">{resumen(turno)}</span>
            </span>
            <span className="flex flex-none flex-col items-end justify-between gap-1.5">
              <span className={`font-display text-lg leading-none font-bold tabular-nums ${cancelado ? "line-through" : ""}`}>{formatPesos(turno.total)}</span>
              <EstadoPill estado={turno.estado} />
            </span>
          </>
        )
      }
    >
      {(close) => <Panel turno={turno} close={close} />}
    </Modal>
  );
}

function Panel({ turno, close }: { turno: TurnoVista; close: () => void }) {
  const [modo, setModo] = useState<"ver" | "editar" | "cancelar">("ver");
  const [pago, setPago] = useState(turno.medioPago ?? "efectivo");
  const [error, setError] = useState<string>();
  const [pendiente, empezar] = useTransition();

  const cambiar = (estado: CambioEstado, medio?: string) =>
    empezar(async () => {
      const r = await cambiarEstado(turno.id, estado, medio);
      if (r.error) setError(r.error);
      else close();
    });

  if (modo === "editar") {
    return (
      <div className="flex flex-col gap-4">
        <button type="button" onClick={() => setModo("ver")} className={`${btnSmCls} self-start`}>
          ‹ Volver al turno
        </button>
        <TurnoForm turno={turno} close={close} />
      </div>
    );
  }

  const v = turno.vehiculo;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">{turno.fechaHora}</p>
          <p className="mt-1 text-sm text-muted">
            {v.modelo || "Sin modelo"} · {TAMANOS[v.tamano as Tamano] ?? v.tamano}
          </p>
        </div>
        <EstadoPill estado={turno.estado} />
      </div>

      <Link href={`/clientes/${turno.cliente.id}`} className="flex items-center gap-3 rounded-xl border border-line bg-raised px-3 py-2.5">
        <span className="grid size-[42px] flex-none place-items-center rounded-full border border-line bg-surface font-display text-base font-bold text-brand">
          {iniciales(turno.cliente.nombre)}
        </span>
        <span className="min-w-0 flex-1">
          <b className="block truncate">{turno.cliente.nombre}</b>
          <span className="block text-[13px] text-muted tabular-nums">{turno.cliente.telefono || "Sin teléfono"}</span>
        </span>
        <span className="text-[13px] text-muted">Ficha ›</span>
      </Link>

      <ul className="flex flex-col gap-2">
        {turno.items.map((i, n) => (
          <li key={n} className="flex flex-col gap-1 rounded-xl border border-line bg-raised p-3">
            <div className="flex items-center gap-2">
              <span className="flex flex-none gap-0.5">
                {i.colores.map((c, k) => (
                  <span key={k} className="size-[9px] rounded-full" style={{ backgroundColor: c }} />
                ))}
              </span>
              <b className="min-w-0 flex-1">{i.nombre}</b>
              <span className="font-display text-lg leading-none font-bold tabular-nums">{formatPesos(i.precio)}</span>
            </div>
            {i.tipo === "combo" && <p className="text-[13px] text-muted">Incluye: {i.incluye.join(", ")}</p>}
            {i.referencia !== null && i.precio !== i.referencia && (
              <p className="text-[13px] text-muted tabular-nums">
                Referencia {formatPesos(i.referencia)}
                {i.nota ? ` · ${i.nota}` : ""}
              </p>
            )}
          </li>
        ))}
      </ul>

      <div className="flex items-baseline justify-between">
        <span className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">Total</span>
        <span className="font-display text-[44px] leading-none font-bold tabular-nums">{formatPesos(turno.total)}</span>
      </div>

      {turno.estado === "realizado" && turno.medioPago && (
        <p className="text-[13px] text-muted">Cobrado con {MEDIOS_PAGO[turno.medioPago as keyof typeof MEDIOS_PAGO] ?? turno.medioPago}.</p>
      )}
      {turno.notas && <p className="text-[13px] text-muted">{turno.notas}</p>}

      <FormError message={error} />

      {turno.estado === "agendado" && modo === "ver" && (
        <>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="d-pago" className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">
              Medio de pago
            </label>
            <select id="d-pago" value={pago} onChange={(e) => setPago(e.target.value)} className={inputCls}>
              {Object.entries(MEDIOS_PAGO).map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <button type="button" disabled={pendiente} onClick={() => cambiar("realizado", pago)} className={btnPrimaryCls}>
            {pendiente ? "Guardando…" : "Marcar como realizado"}
          </button>
          <div className="grid grid-cols-2 gap-2.5">
            <button type="button" onClick={() => setModo("editar")} className={`${btnSmCls} min-h-11`}>
              Editar
            </button>
            <button type="button" onClick={() => setModo("cancelar")} className={`${btnSmCls} min-h-11 text-bad`}>
              Cancelar turno
            </button>
          </div>
        </>
      )}

      {turno.estado === "agendado" && modo === "cancelar" && (
        <div className="flex flex-col gap-3 rounded-xl border border-line bg-raised p-3">
          <b>¿Cancelar este turno?</b>
          <p className="text-[13px] text-muted">Queda en el historial como cancelado y no cuenta en la facturación. Se puede volver a agendar.</p>
          <div className="grid grid-cols-2 gap-2.5">
            <button type="button" onClick={() => setModo("ver")} className={`${btnSmCls} min-h-11`}>
              Volver
            </button>
            <button type="button" disabled={pendiente} onClick={() => cambiar("cancelado")} className={`${btnSmCls} min-h-11 text-bad`}>
              Sí, cancelar
            </button>
          </div>
        </div>
      )}

      {turno.estado === "realizado" && (
        <div className="grid grid-cols-2 gap-2.5">
          <button type="button" onClick={() => setModo("editar")} className={`${btnSmCls} min-h-11`}>
            Editar
          </button>
          <button type="button" disabled={pendiente} onClick={() => cambiar("agendado")} className={`${btnSmCls} min-h-11`}>
            Volver a agendado
          </button>
        </div>
      )}

      {turno.estado === "cancelado" && (
        <button type="button" disabled={pendiente} onClick={() => cambiar("agendado")} className={btnPrimaryCls}>
          {pendiente ? "Guardando…" : "Volver a agendar"}
        </button>
      )}
    </div>
  );
}
