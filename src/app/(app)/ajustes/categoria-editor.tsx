"use client";

import { useActionState, useEffect, useState } from "react";
import { Modal } from "@/components/modal";
import { btnPrimaryCls, btnSmCls, Field, FormError, inputCls } from "@/components/form";
import { formatPesos } from "@/lib/format";
import { guardarCategoria, type FormState } from "./actions";

export const PALETA = ["#2F8CFF", "#F28C1B", "#A78BFA", "#F5C400", "#3DD6C4", "#E5584F", "#F472B6", "#8BC34A"];

export type Categoria = {
  id: number;
  nombre: string;
  color: string;
  precio_referencia: number | null;
  activa: boolean;
};

export type ColorEnUso = { id: number; nombre: string; color: string };

export function CategoriaEditor({ categoria, enUso = [] }: { categoria?: Categoria; enUso?: ColorEnUso[] }) {
  if (!categoria) {
    return (
      <Modal trigger="+ Nueva" triggerClassName={btnSmCls} title="Nueva categoría">
        {(close) => <CategoriaForm close={close} enUso={enUso} />}
      </Modal>
    );
  }
  return (
    <Modal
      title="Editar categoría"
      triggerClassName={`flex w-full items-center gap-3 rounded-xl border border-line bg-surface px-3.5 py-3 text-left ${
        categoria.activa ? "" : "opacity-55"
      }`}
      trigger={
        <>
          <span className="size-[22px] flex-none rounded-full" style={{ backgroundColor: categoria.color }} />
          <span className="min-w-0 flex-1 font-semibold">
            {categoria.nombre}
            {!categoria.activa && (
              <span className="ml-2 rounded bg-raised px-1.5 py-[3px] text-[10px] font-semibold tracking-[0.1em] text-muted uppercase">
                Inactiva
              </span>
            )}
          </span>
          <span className="text-[13px] text-muted tabular-nums">
            {categoria.precio_referencia != null ? `Ref. ${formatPesos(categoria.precio_referencia)}` : "Sin precio de referencia"}
          </span>
        </>
      }
    >
      {(close) => <CategoriaForm categoria={categoria} close={close} enUso={enUso} />}
    </Modal>
  );
}

function CategoriaForm({ categoria, close, enUso }: { categoria?: Categoria; close: () => void; enUso: ColorEnUso[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(guardarCategoria, {});
  useEffect(() => {
    if (state.ok) close();
  }, [state, close]);

  const [color, setColor] = useState((categoria?.color ?? PALETA[5]).toUpperCase());
  const personalizado = !PALETA.some((c) => c === color);
  const repetida = enUso.find((c) => c.id !== categoria?.id && c.color.toUpperCase() === color);

  return (
    <form action={action} className="flex flex-col gap-4">
      {categoria && <input type="hidden" name="id" value={categoria.id} />}
      <Field label="Nombre" htmlFor="cat-nombre">
        <input id="cat-nombre" name="nombre" required defaultValue={categoria?.nombre} className={inputCls} />
      </Field>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">Color en la agenda</legend>
        <input type="hidden" name="color" value={color} />
        <div className="flex flex-wrap items-center gap-2.5">
          {PALETA.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Color ${c}`}
              aria-pressed={c === color}
              onClick={() => setColor(c)}
              className="size-10 rounded-full border-[3px] border-transparent outline outline-1 outline-line aria-pressed:border-surface aria-pressed:outline-2 aria-pressed:outline-fg"
              style={{ backgroundColor: c }}
            />
          ))}
          <label
            className={`relative size-10 cursor-pointer rounded-full border-[3px] border-transparent outline outline-1 outline-line focus-within:outline-2 focus-within:outline-brand ${
              personalizado ? "border-surface outline-2 outline-fg" : ""
            }`}
            style={{ background: "conic-gradient(#f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)" }}
            title="Elegir otro color"
          >
            <span className="sr-only">Elegir otro color</span>
            <input
              type="color"
              value={color.toLowerCase()}
              onChange={(e) => setColor(e.target.value.toUpperCase())}
              className="absolute inset-0 size-full cursor-pointer opacity-0"
            />
          </label>
        </div>
        <p className="flex items-center gap-2 text-[13px] text-muted">
          <span className="size-3.5 rounded-full outline outline-1 outline-line" style={{ backgroundColor: color }} />
          <span className="tabular-nums">{color}</span>
          {repetida && <span className="text-fg">· ya lo usa {repetida.nombre}</span>}
        </p>
      </fieldset>

      <Field label="Precio de referencia (opcional)" htmlFor="cat-precio" hint="Se sugiere al armar un turno. Siempre se puede cambiar el precio cobrado.">
        <input
          id="cat-precio"
          name="precio_referencia"
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          defaultValue={categoria?.precio_referencia ?? ""}
          placeholder="Sin precio de referencia"
          className={inputCls}
        />
      </Field>

      {categoria && (
        <label className="flex items-center gap-3 rounded-[10px] border border-line bg-raised px-3 py-2.5">
          <input type="checkbox" name="activa" defaultChecked={categoria.activa} className="size-5 accent-brand" />
          <span>
            Activa
            <span className="block text-[13px] text-muted">Las categorías inactivas no aparecen al armar turnos, pero se conserva el historial.</span>
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
