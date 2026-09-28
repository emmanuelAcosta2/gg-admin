"use client";

import { useActionState, useEffect } from "react";
import { Modal } from "@/components/modal";
import { btnPrimaryCls, btnSmCls, Field, FormError, inputCls } from "@/components/form";
import { TAMANOS } from "@/lib/dominio";
import { guardarVehiculo, type FormState } from "./actions";

const nuevoCls = "inline-flex min-h-9 items-center justify-center rounded-[10px] border border-brand bg-brand px-3 text-sm font-semibold text-brand-ink";

export type VehiculoDatos = { id: number; matricula: string | null; marca_modelo: string; tamano: string };

export function VehiculoEditor({ clienteId, vehiculo }: { clienteId: number; vehiculo?: VehiculoDatos }) {
  return (
    <Modal
      title={vehiculo ? "Editar vehículo" : "Nuevo vehículo"}
      trigger={vehiculo ? "Editar" : "+ Vehículo"}
      triggerClassName={vehiculo ? btnSmCls : nuevoCls}
    >
      {(close) => <VehiculoForm clienteId={clienteId} vehiculo={vehiculo} close={close} />}
    </Modal>
  );
}

function VehiculoForm({ clienteId, vehiculo, close }: { clienteId: number; vehiculo?: VehiculoDatos; close: () => void }) {
  const [state, action, pending] = useActionState<FormState, FormData>(guardarVehiculo, {});
  useEffect(() => {
    if (state.ok) close();
  }, [state, close]);

  return (
    <form action={action} className="flex flex-col gap-4">
      {vehiculo ? <input type="hidden" name="id" value={vehiculo.id} /> : <input type="hidden" name="cliente_id" value={clienteId} />}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Matrícula (opcional)" htmlFor="veh-mat">
          <input id="veh-mat" name="matricula" autoComplete="off" defaultValue={vehiculo?.matricula ?? ""} placeholder="SAB 1234" className={`${inputCls} uppercase`} />
        </Field>
        <Field label="Tamaño" htmlFor="veh-tam">
          <select id="veh-tam" name="tamano" defaultValue={vehiculo?.tamano ?? "mediano"} className={inputCls}>
            {Object.entries(TAMANOS).map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Marca y modelo" htmlFor="veh-mm">
        <input id="veh-mm" name="marca_modelo" autoComplete="off" defaultValue={vehiculo?.marca_modelo} placeholder="Toyota Corolla" className={inputCls} />
      </Field>
      <p className="text-[13px] text-muted">El tamaño se guarda en el vehículo y define el precio que se sugiere en cada turno.</p>
      <FormError message={state.error} />
      <button disabled={pending} className={btnPrimaryCls}>
        {pending ? "Guardando…" : "Guardar"}
      </button>
    </form>
  );
}
