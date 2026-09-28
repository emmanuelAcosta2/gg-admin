"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { normalizarMatricula, TAMANOS, type Tamano } from "@/lib/dominio";
import { createClient } from "@/lib/supabase/server";

export type FormState = { ok?: true; error?: string };

const texto = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const numero = (fd: FormData, k: string) => {
  const v = texto(fd, k);
  return v ? Number(v) : null;
};
const esTamano = (t: string): t is Tamano => t in TAMANOS;

const MATRICULA_REPETIDA = "Ya hay un vehículo con esa matrícula.";
const ERROR_GENERICO = "No se pudo guardar. Probá de nuevo.";

export async function guardarCliente(_prev: FormState, fd: FormData): Promise<FormState> {
  if (!(await requireUser())) return { error: "Sin sesión." };

  const id = numero(fd, "id");
  const nombre = texto(fd, "nombre");
  if (!nombre) return { error: "Poné el nombre del cliente." };
  const telefono = texto(fd, "telefono") || null;
  const notas = texto(fd, "notas") || null;

  const supabase = await createClient();

  if (id) {
    const { data, error } = await supabase.from("clientes").update({ nombre, telefono, notas }).eq("id", id).select("id");
    if (error) return { error: ERROR_GENERICO };
    if (!data?.length) return { error: "El cliente ya no existe." };
    revalidatePath("/clientes", "layout");
    return { ok: true };
  }

  const matricula = normalizarMatricula(texto(fd, "matricula")) || null;
  const tamano = texto(fd, "tamano") || "mediano";
  if (!esTamano(tamano)) return { error: "Elegí un tamaño válido." };

  const { data, error } = await supabase.rpc("crear_cliente", {
    p_nombre: nombre,
    p_telefono: telefono as string,
    p_notas: notas as string,
    p_matricula: matricula as string,
    p_marca_modelo: texto(fd, "marca_modelo"),
    p_tamano: tamano,
  });
  if (error) return { error: error.code === "23505" ? MATRICULA_REPETIDA : ERROR_GENERICO };

  revalidatePath("/clientes", "layout");
  redirect(`/clientes/${data}`);
}

export async function guardarVehiculo(_prev: FormState, fd: FormData): Promise<FormState> {
  if (!(await requireUser())) return { error: "Sin sesión." };

  const id = numero(fd, "id");
  const clienteId = numero(fd, "cliente_id");
  const matricula = normalizarMatricula(texto(fd, "matricula")) || null;
  const tamano = texto(fd, "tamano");
  if (!esTamano(tamano)) return { error: "Elegí un tamaño válido." };
  const fila = { matricula, marca_modelo: texto(fd, "marca_modelo"), tamano };

  const supabase = await createClient();
  let res;
  if (id) {
    res = await supabase.from("vehiculos").update(fila).eq("id", id).select("id");
  } else {
    if (!clienteId) return { error: "Falta el cliente." };
    res = await supabase.from("vehiculos").insert({ ...fila, cliente_id: clienteId }).select("id");
  }
  if (res.error) return { error: res.error.code === "23505" ? MATRICULA_REPETIDA : ERROR_GENERICO };
  if (!res.data?.length) return { error: "El vehículo ya no existe." };

  revalidatePath("/clientes", "layout");
  return { ok: true };
}
