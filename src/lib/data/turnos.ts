import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { aInstante, horaLocal, type TurnoVista } from "@/lib/agenda";
import { diaLocal, formatFechaHora } from "@/lib/dominio";
import type { Database } from "@/lib/supabase/database.types";

type Cliente = SupabaseClient<Database>;

// turno_items se relaciona con categorias por la FK directa y por turno_item_categorias:
// hay que indicar cuál (categoria_id) o PostgREST rechaza la consulta por ambigua.
const SELECT_TURNOS = `
  id, inicio, estado, medio_pago, notas,
  vehiculos ( id, matricula, marca_modelo, tamano, clientes ( id, nombre, telefono ) ),
  turno_items (
    tipo, categoria_id, combo_id, precio_cobrado, nota_ajuste,
    categorias!categoria_id ( nombre, color, precio_referencia ),
    combos!combo_id ( nombre, precio_referencia ),
    turno_item_categorias ( categorias ( nombre, color ) )
  )
`;

const consultaTurnos = (s: Cliente) => s.from("turnos").select(SELECT_TURNOS);
type Fila = NonNullable<Awaited<ReturnType<typeof consultaTurnos>>["data"]>[number];

function error(que: string, e: { message: string }): never {
  throw new Error(`No se pudo leer ${que}: ${e.message}`);
}

/** Turnos cuyo inicio cae en [desde, hasta) (fechas locales), del más viejo al más nuevo. */
export async function turnosEnRango(supabase: Cliente, desde: string, hasta: string) {
  const { data, error: e } = await consultaTurnos(supabase)
    .gte("inicio", aInstante(desde, "00:00"))
    .lt("inicio", aInstante(hasta, "00:00"))
    .order("inicio");
  if (e) error("los turnos", e);
  return data.map(aTurnoVista);
}

/** Turnos por id, respetando el orden de `ids`. */
export async function turnosPorIds(supabase: Cliente, ids: number[]) {
  if (!ids.length) return [];
  const { data, error: e } = await consultaTurnos(supabase).in("id", ids);
  if (e) error("los turnos", e);
  const porId = new Map(data.map((t) => [t.id, aTurnoVista(t)]));
  return ids.map((id) => porId.get(id)).filter((t) => t !== undefined);
}

export function aTurnoVista(t: Fila): TurnoVista {
  const items = t.turno_items.map((i) => {
    const esCombo = i.combo_id !== null;
    const incluidas = i.turno_item_categorias.map((x) => x.categorias).filter((x) => x !== null);
    return {
      tipo: esCombo ? ("combo" as const) : ("servicio" as const),
      refId: (esCombo ? i.combo_id : i.categoria_id) as number,
      nombre: (esCombo ? i.combos?.nombre : i.categorias?.nombre) ?? "Servicio",
      colores: esCombo ? incluidas.map((x) => x.color) : [i.categorias?.color ?? "#8c919c"],
      incluye: esCombo ? incluidas.map((x) => x.nombre) : [],
      precio: i.precio_cobrado,
      referencia: (esCombo ? i.combos?.precio_referencia : i.categorias?.precio_referencia) ?? null,
      nota: i.nota_ajuste,
    };
  });
  const v = t.vehiculos!;
  const c = v.clientes!;
  return {
    id: t.id,
    dia: diaLocal(t.inicio),
    hora: horaLocal(t.inicio),
    fechaHora: formatFechaHora(t.inicio),
    estado: t.estado as TurnoVista["estado"],
    medioPago: t.medio_pago,
    notas: t.notas,
    total: items.reduce((s, i) => s + i.precio, 0),
    vehiculo: { id: v.id, matricula: v.matricula, modelo: v.marca_modelo, tamano: v.tamano },
    cliente: { id: c.id, nombre: c.nombre, telefono: c.telefono },
    items,
  };
}

/** Todo lo que necesita el formulario de turnos: servicios, combos, vehículos y clientes activos. */
export async function cargarCatalogo(supabase: Cliente, hoy: string) {
  const [categorias, combos, vehiculos, clientes] = await Promise.all([
    supabase.from("categorias").select("id, nombre, color, precio_referencia").eq("activa", true).order("nombre"),
    supabase.from("combos").select("id, nombre, precio_referencia, combo_categorias ( categorias ( color ) )").eq("activo", true).order("nombre"),
    supabase.from("vehiculos").select("id, matricula, marca_modelo, tamano, cliente_id, clientes ( nombre )").order("matricula"),
    supabase.from("clientes").select("id, nombre").order("nombre"),
  ]);
  for (const r of [categorias, combos, vehiculos, clientes]) if (r.error) error("el catálogo", r.error);

  return {
    hoy,
    categorias: categorias.data!.map((c) => ({ id: c.id, nombre: c.nombre, color: c.color, precio: c.precio_referencia })),
    combos: combos.data!.map((c) => ({
      id: c.id,
      nombre: c.nombre,
      precio: c.precio_referencia,
      colores: c.combo_categorias.map((x) => x.categorias?.color).filter((x) => x !== undefined),
    })),
    vehiculos: vehiculos.data!.map((v) => ({
      id: v.id,
      matricula: v.matricula,
      modelo: v.marca_modelo,
      tamano: v.tamano,
      cliente: v.clientes?.nombre ?? "",
      clienteId: v.cliente_id,
    })),
    clientes: clientes.data!,
  };
}
