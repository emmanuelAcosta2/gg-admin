"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { aInstante, fechaValida } from "@/lib/agenda";
import { MEDIOS_PAGO } from "@/lib/dominio";
import { createClient } from "@/lib/supabase/server";

export type FormState = { ok?: true; error?: string; fecha?: string };

const ERROR_GENERICO = "No se pudo guardar. Probá de nuevo.";
const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
const esMedio = (m: string): m is keyof typeof MEDIOS_PAGO => m in MEDIOS_PAGO;

type ItemEntrada = { tipo: "servicio" | "combo"; refId: number; precio: number; nota?: string };

function leerItems(crudo: string): ItemEntrada[] | null {
  try {
    const arr: unknown = JSON.parse(crudo);
    if (!Array.isArray(arr) || arr.length === 0) return null;
    const items = arr.map((x): ItemEntrada | null => {
      if (typeof x !== "object" || x === null) return null;
      const { tipo, refId, precio, nota } = x as Record<string, unknown>;
      if (tipo !== "servicio" && tipo !== "combo") return null;
      if (!Number.isInteger(refId) || !Number.isInteger(precio) || (precio as number) < 0) return null;
      return { tipo, refId: refId as number, precio: precio as number, nota: typeof nota === "string" ? nota : undefined };
    });
    return items.every((i) => i !== null) ? (items as ItemEntrada[]) : null;
  } catch {
    return null;
  }
}

export async function guardarTurno(_prev: FormState, fd: FormData): Promise<FormState> {
  if (!(await requireUser())) return { error: "Sin sesión." };

  const texto = (k: string) => String(fd.get(k) ?? "").trim();
  const id = texto("id") ? Number(texto("id")) : null;
  const vehiculoId = Number(texto("vehiculo_id"));
  const fecha = fechaValida(texto("fecha"), "");
  const hora = texto("hora");
  const medio = texto("medio_pago");
  const items = leerItems(texto("items"));

  if (!Number.isInteger(vehiculoId) || vehiculoId <= 0) return { error: "Elegí el vehículo." };
  if (!fecha) return { error: "Elegí la fecha." };
  if (!HORA.test(hora)) return { error: "Elegí la hora." };
  if (medio && !esMedio(medio)) return { error: "Medio de pago inválido." };
  if (!items) return { error: "Agregá al menos un servicio o combo, con su precio." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("guardar_turno", {
    p_id: id as number,
    p_vehiculo_id: vehiculoId,
    p_inicio: aInstante(fecha, hora),
    p_medio_pago: (medio || null) as string,
    p_notas: (texto("notas") || null) as string,
    p_items: items.map((i) => ({
      tipo: i.tipo,
      categoria_id: i.tipo === "servicio" ? i.refId : null,
      combo_id: i.tipo === "combo" ? i.refId : null,
      precio: i.precio,
      nota: i.nota ?? null,
    })),
  });

  if (error) {
    if (error.code === "23514") return { error: "Un turno realizado necesita medio de pago." };
    if (error.code === "22023") return { error: error.message };
    return { error: ERROR_GENERICO };
  }

  revalidatePath("/agenda");
  return { ok: true, fecha };
}

export type CambioEstado = "realizado" | "cancelado" | "agendado";

const DESDE: Record<CambioEstado, string[]> = {
  realizado: ["agendado"],
  cancelado: ["agendado"],
  agendado: ["cancelado", "realizado"],
};

export async function cambiarEstado(id: number, estado: CambioEstado, medioPago?: string): Promise<FormState> {
  if (!(await requireUser())) return { error: "Sin sesión." };
  if (!Number.isInteger(id)) return { error: "Turno inválido." };

  const cambios: { estado: CambioEstado; medio_pago?: string } = { estado };
  if (estado === "realizado") {
    if (!medioPago || !esMedio(medioPago)) return { error: "Elegí cómo se cobró." };
    cambios.medio_pago = medioPago;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("turnos").update(cambios).eq("id", id).in("estado", DESDE[estado]).select("id");
  if (error) return { error: ERROR_GENERICO };
  if (!data?.length) return { error: "El turno cambió mientras lo mirabas. Recargá la agenda." };

  revalidatePath("/agenda");
  return { ok: true };
}
