"use client";

import { useActionState, useEffect } from "react";
import { Modal } from "@/components/modal";
import { btnPrimaryCls, btnSmCls, Field, FormError, inputCls } from "@/components/form";
import { formatPesos } from "@/lib/format";
import { guardarCombo, type FormState } from "./actions";

export type CategoriaOpcion = { id: number; nombre: string; color: string; activa: boolean };
export type Combo = { id: number; nombre: string; precio_referencia: number; activo: boolean; categoriaIds: number[] };

export function ComboEditor({ combo, categorias }: { combo?: Combo; categorias: CategoriaOpcion[] }) {
  if (!combo) {
    return (
      <Modal trigger="+ Nuevo" triggerClassName={btnSmCls} title="Nuevo combo">
        {(close) => <ComboForm categorias={categorias} close={close} />}
      </Modal>
    );
  }
  const incluidas = combo.categoriaIds.map((id) => categorias.find((c) => c.id === id)).filter((c) => c !== undefined);
  return (
    <Modal
      title="Editar combo"
      triggerClassName={`flex w-full items-center gap-3 rounded-xl border border-line bg-surface px-3.5 py-3 text-left ${
        combo.activo ? "" : "opacity-55"
      }`}
      trigger={
        <>
          <span className="min-w-0 flex-1">
            <span className="font-semibold">{combo.nombre}</span>
            {!combo.activo && (
              <span className="ml-2 rounded bg-raised px-1.5 py-[3px] text-[10px] font-semibold tracking-[0.1em] text-muted uppercase">
                Inactivo
              </span>
            )}
            <span className="mt-1 flex flex-wrap gap-x-3 text-[13px] text-muted">
              {incluidas.map((c) => (
                <span key={c.id} className="inline-flex items-center gap-1.5 whitespace-nowrap">
                  <span className="size-[9px] rounded-full" style={{ backgroundColor: c.color }} />
                  {c.nombre}
                </span>
              ))}
            </span>
          </span>
          <span className="font-display text-lg font-bold tracking-wide tabular-nums">{formatPesos(combo.precio_referencia)}</span>
        </>
      }
    >
      {(close) => <ComboForm combo={combo} categorias={categorias} close={close} />}
    </Modal>
  );
}

function ComboForm({ combo, categorias, close }: { combo?: Combo; categorias: CategoriaOpcion[]; close: () => void }) {
  const [state, action, pending] = useActionState<FormState, FormData>(guardarCombo, {});
  useEffect(() => {
    if (state.ok) close();
  }, [state, close]);

  // Se ofrecen las categorías activas y las que el combo ya incluye.
  const opciones = categorias.filter((c) => c.activa || combo?.categoriaIds.includes(c.id));

  return (
    <form action={action} className="flex flex-col gap-4">
      {combo && <input type="hidden" name="id" value={combo.id} />}
      <Field label="Nombre" htmlFor="combo-nombre">
        <input id="combo-nombre" name="nombre" required defaultValue={combo?.nombre} className={inputCls} />
      </Field>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">Categorías que incluye</legend>
        {opciones.map((c) => (
          <label key={c.id} className="flex items-center gap-3 rounded-[10px] border border-line bg-raised px-3 py-2.5">
            <input
              type="checkbox"
              name="categorias"
              value={c.id}
              defaultChecked={combo?.categoriaIds.includes(c.id)}
              className="size-5 accent-brand"
            />
            <span className="size-[9px] rounded-full" style={{ backgroundColor: c.color }} />
            {c.nombre}
          </label>
        ))}
      </fieldset>

      <Field
        label="Precio de referencia"
        htmlFor="combo-precio"
        hint="El precio del combo no se reparte entre sus categorías."
      >
        <input
          id="combo-precio"
          name="precio_referencia"
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          required
          defaultValue={combo?.precio_referencia}
          className={inputCls}
        />
      </Field>

      {combo && (
        <label className="flex items-center gap-3 rounded-[10px] border border-line bg-raised px-3 py-2.5">
          <input type="checkbox" name="activo" defaultChecked={combo.activo} className="size-5 accent-brand" />
          <span>
            Activo
            <span className="block text-[13px] text-muted">Los combos inactivos no aparecen al armar turnos, pero se conserva el historial.</span>
          </span>
        </label>
      )}

      <FormError message={state.error} />
      <button disabled={pending} className={btnPrimaryCls}>
        {pending ? "Guardando…" : "Guardar"}
      </button>
    </form>
  );
}
