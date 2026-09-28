"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { aInstante, fechaValida, horaLocal } from "@/lib/agenda";
import { MEDIOS_PAGO, normalizarMatricula, TAMANOS } from "@/lib/dominio";
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

/** Ventana (en minutos) dentro de la cual otro turno se considera cercano. */
const VENTANA_CONFLICTO_MIN = 30;

export type Conflicto = { hora: string; matricula: string; cliente: string };

/** Turnos no cancelados que empiezan a menos de 30 minutos del horario pedido. Solo avisa: no bloquea. */
export async function buscarConflictos(fecha: string, hora: string, excluirId?: number): Promise<Conflicto[]> {
  if (!(await requireUser())) return [];
  if (!fechaValida(fecha, "") || !HORA.test(hora)) return [];

  const centro = new Date(aInstante(fecha, hora)).getTime();
  const margen = VENTANA_CONFLICTO_MIN * 60_000;
  const supabase = await createClient();
  let q = supabase
    .from("turnos")
    .select("id, inicio, vehiculos ( matricula, clientes ( nombre ) )")
    .neq("estado", "cancelado")
    .gt("inicio", new Date(centro - margen).toISOString())
    .lt("inicio", new Date(centro + margen).toISOString())
    .order("inicio");
  if (excluirId) q = q.neq("id", excluirId);

  const { data } = await q;
  return (data ?? []).map((t) => ({
    hora: horaLocal(t.inicio),
    matricula: t.vehiculos?.matricula ?? "",
    cliente: t.vehiculos?.clientes?.nombre ?? "",
  }));
}

export type VehiculoNuevo = { id: number; matricula: string | null; modelo: string; tamano: string; cliente: string; clienteId: number };
export type AltaRapida = {
  clienteId?: number;
  nombre?: string;
  telefono?: string;
  matricula: string;
  marcaModelo: string;
  tamano: string;
};

/** Da de alta un vehículo (y su cliente si es nuevo) sin salir del formulario del turno. */
export async function altaRapida(datos: AltaRapida): Promise<{ error?: string; vehiculo?: VehiculoNuevo }> {
  if (!(await requireUser())) return { error: "Sin sesión." };

  const matricula = normalizarMatricula(datos.matricula ?? "") || null;
  if (!(datos.tamano in TAMANOS)) return { error: "Elegí un tamaño válido." };
  const modelo = (datos.marcaModelo ?? "").trim();
  const repetida = "Ya hay un vehículo con esa matrícula.";

  const supabase = await createClient();
  let clienteId = datos.clienteId;

  if (!clienteId) {
    const nombre = (datos.nombre ?? "").trim();
    if (!nombre) return { error: "Poné el nombre del cliente." };
    // El vehículo se inserta siempre abajo, a mano: acá solo se crea el cliente, sin vehículo.
    const { data, error } = await supabase.rpc("crear_cliente", {
      p_nombre: nombre,
      p_telefono: (datos.telefono?.trim() || null) as string,
      p_notas: null as unknown as string,
      p_matricula: null as unknown as string,
      p_marca_modelo: null as unknown as string,
      p_tamano: null as unknown as string,
    });
    if (error) return { error: ERROR_GENERICO };
    clienteId = data;
  }

  const { data, error } = await supabase
    .from("vehiculos")
    .insert({ cliente_id: clienteId, matricula, marca_modelo: modelo, tamano: datos.tamano })
    .select("id, matricula, marca_modelo, tamano, clientes ( nombre )")
    .single();
  if (error) return { error: error.code === "23505" ? repetida : ERROR_GENERICO };
  revalidatePath("/clientes", "layout");
  revalidatePath("/agenda");
  return { vehiculo: { id: data.id, matricula: data.matricula, modelo: data.marca_modelo, tamano: data.tamano, cliente: data.clientes?.nombre ?? "", clienteId } };
}
