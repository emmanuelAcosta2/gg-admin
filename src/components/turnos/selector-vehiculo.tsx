"use client";

import { useMemo, useState, useTransition } from "react";
import { btnSmCls, FormError, inputCls } from "@/components/form";
import { matriculaSinEspacios, TAMANOS, type Tamano } from "@/lib/dominio";
import { altaRapida, type VehiculoNuevo } from "./actions";
import { useCatalogo } from "./catalogo";

const sinTildes = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
const MAX_RESULTADOS = 6;

type Vehiculo = VehiculoNuevo;

/** Elige el vehículo del turno: búsqueda por matrícula, modelo o cliente, y alta rápida de cliente o vehículo. */
export function SelectorVehiculo({ valor, onChange }: { valor: number; onChange: (id: number) => void }) {
  const cat = useCatalogo();
  const [agregados, setAgregados] = useState<Vehiculo[]>([]);
  const [clientesNuevos, setClientesNuevos] = useState<{ id: number; nombre: string }[]>([]);
  const [modo, setModo] = useState<"elegido" | "buscando" | "alta">(valor ? "elegido" : "buscando");
  const [q, setQ] = useState("");

  const vehiculos: Vehiculo[] = useMemo(() => [...cat.vehiculos, ...agregados], [cat.vehiculos, agregados]);
  const clientes = useMemo(() => [...cat.clientes, ...clientesNuevos], [cat.clientes, clientesNuevos]);
  const elegido = vehiculos.find((v) => v.id === valor);

  const resultados = useMemo(() => {
    const t = sinTildes(q).trim();
    if (!t) return vehiculos;
    return vehiculos.filter((v) => matriculaSinEspacios(v.matricula).includes(matriculaSinEspacios(t)) || sinTildes(`${v.modelo} ${v.cliente}`).includes(t));
  }, [q, vehiculos]);

  const elegir = (id: number) => {
    onChange(id);
    setModo("elegido");
    setQ("");
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">Vehículo</span>

      {modo === "elegido" && elegido && (
        <div className="flex items-center gap-3 rounded-xl border border-line bg-raised px-3 py-2.5">
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg leading-none font-bold tracking-wide uppercase">{elegido.matricula || "Sin matrícula"}</p>
            <p className="mt-1 truncate text-[13px] text-muted">
              {elegido.modelo || "Sin modelo"} · {TAMANOS[elegido.tamano as Tamano] ?? elegido.tamano} · {elegido.cliente}
            </p>
          </div>
          <button type="button" onClick={() => setModo("buscando")} className={btnSmCls}>
            Cambiar
          </button>
        </div>
      )}

      {modo === "buscando" && (
        <div className="flex flex-col gap-2 rounded-xl border border-line bg-raised p-2.5">
          <input
            type="search"
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por matrícula, modelo o cliente"
            aria-label="Buscar vehículo"
            autoComplete="off"
            className={inputCls}
          />
          <ul className="flex flex-col gap-1" role="listbox" aria-label="Vehículos">
            {resultados.slice(0, MAX_RESULTADOS).map((v) => (
              <li key={v.id} role="option" aria-selected={v.id === valor}>
                <button
                  type="button"
                  onClick={() => elegir(v.id)}
                  className="flex w-full items-center gap-3 rounded-[10px] px-2.5 py-2 text-left hover:bg-surface aria-selected:bg-surface"
                >
                  <b className="w-[96px] flex-none font-display text-base tracking-wide uppercase">{v.matricula || "Sin matrícula"}</b>
                  <span className="min-w-0 flex-1 truncate text-[13px] text-muted">
                    {v.modelo || "Sin modelo"} — {v.cliente}
                  </span>
                </button>
              </li>
            ))}
            {resultados.length === 0 && <li className="px-2.5 py-2 text-sm text-muted">No hay vehículos que coincidan.</li>}
            {resultados.length > MAX_RESULTADOS && (
              <li className="px-2.5 py-1 text-[12px] text-muted">Hay {resultados.length - MAX_RESULTADOS} más. Seguí escribiendo para acotar.</li>
            )}
          </ul>
          <div className="flex gap-2">
            <button type="button" onClick={() => setModo("alta")} className={`${btnSmCls} flex-1`}>
              + Cliente o vehículo nuevo
            </button>
            {elegido && (
              <button type="button" onClick={() => setModo("elegido")} className={btnSmCls}>
                Cancelar
              </button>
            )}
          </div>
        </div>
      )}

      {modo === "alta" && (
        <AltaRapida
          clientes={clientes}
          volver={() => setModo(elegido ? "elegido" : "buscando")}
          creado={(v) => {
            setAgregados((p) => [...p, v]);
            if (!clientes.some((c) => c.id === v.clienteId)) setClientesNuevos((p) => [...p, { id: v.clienteId, nombre: v.cliente }]);
            elegir(v.id);
          }}
        />
      )}
    </div>
  );
}

function AltaRapida({
  clientes,
  volver,
  creado,
}: {
  clientes: { id: number; nombre: string }[];
  volver: () => void;
  creado: (v: Vehiculo) => void;
}) {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [matricula, setMatricula] = useState("");
  const [modelo, setModelo] = useState("");
  const [tamano, setTamano] = useState<Tamano>("mediano");
  const [error, setError] = useState<string>();
  const [pendiente, empezar] = useTransition();

  const existente = clientes.find((c) => sinTildes(c.nombre).trim() === sinTildes(nombre).trim() && nombre.trim() !== "");

  const guardar = () =>
    empezar(async () => {
      const r = await altaRapida({ clienteId: existente?.id, nombre, telefono, matricula, marcaModelo: modelo, tamano });
      if (r.error) setError(r.error);
      else if (r.vehiculo) creado(r.vehiculo);
    });

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line bg-raised p-3">
      <b>Cliente o vehículo nuevo</b>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="alta-cliente" className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">
          Cliente
        </label>
        <input
          id="alta-cliente"
          list="alta-clientes"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          autoComplete="off"
          placeholder="Nombre y apellido"
          className={inputCls}
        />
        <datalist id="alta-clientes">
          {clientes.map((c) => (
            <option key={c.id} value={c.nombre} />
          ))}
        </datalist>
        <p className="text-[13px] text-muted">
          {nombre.trim() === ""
            ? "Escribí un cliente que ya existe para sumarle un vehículo, o uno nuevo."
            : existente
              ? "Cliente existente: se le agrega este vehículo."
              : "Se creará un cliente nuevo."}
        </p>
      </div>

      {nombre.trim() !== "" && !existente && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="alta-tel" className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">
            Teléfono
          </label>
          <input id="alta-tel" type="tel" inputMode="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="099 000 000" className={inputCls} />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="alta-mat" className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">
            Matrícula (opcional)
          </label>
          <input id="alta-mat" value={matricula} onChange={(e) => setMatricula(e.target.value)} autoComplete="off" placeholder="SAB 1234" className={`${inputCls} uppercase`} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="alta-tam" className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">
            Tamaño
          </label>
          <select id="alta-tam" value={tamano} onChange={(e) => setTamano(e.target.value as Tamano)} className={inputCls}>
            {Object.entries(TAMANOS).map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="alta-mm" className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">
          Marca y modelo
        </label>
        <input id="alta-mm" value={modelo} onChange={(e) => setModelo(e.target.value)} autoComplete="off" placeholder="Toyota Corolla" className={inputCls} />
      </div>

      <FormError message={error} />
      <div className="grid grid-cols-2 gap-2.5">
        <button type="button" onClick={volver} className={`${btnSmCls} min-h-11`}>
          Volver
        </button>
        <button
          type="button"
          disabled={pendiente}
          onClick={guardar}
          className="inline-flex min-h-11 items-center justify-center rounded-[10px] border border-brand bg-brand px-3 text-sm font-semibold text-brand-ink disabled:opacity-60"
        >
          {pendiente ? "Guardando…" : "Crear y usar"}
        </button>
      </div>
    </div>
  );
}
