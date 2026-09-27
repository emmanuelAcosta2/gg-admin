"use client";

import { Modal } from "@/components/modal";
import { TurnoForm } from "@/components/turnos/turno-form";

/** Botón flotante "+ Turno": se apoya sobre la barra inferior en celular y en la esquina en escritorio. */
export function NuevoTurno({ fecha }: { fecha: string }) {
  return (
    <Modal
      title="Nuevo turno"
      trigger="+ Turno"
      triggerClassName="fixed right-4 bottom-[calc(76px+env(safe-area-inset-bottom))] z-20 inline-flex min-h-[52px] items-center justify-center rounded-[10px] border border-brand bg-brand px-[22px] text-base font-semibold text-brand-ink shadow-[0_8px_24px_#000a] lg:right-10 lg:bottom-8"
    >
      {(close) => <TurnoForm fecha={fecha} close={close} />}
    </Modal>
  );
}
