"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type FormState = { ok?: true; error?: string };

const COLOR = /^#[0-9A-Fa-f]{6}$/;

function texto(fd: FormData, k: string) {
  return String(fd.get(k) ?? "").trim();
}

function id(fd: FormData) {
  const v = texto(fd, "id");
  return v ? Number(v) : null;
}

/** Vacío -> null. Entero >= 0 -> número. Cualquier otra cosa -> undefined (inválido). */
function pesos(fd: FormData, k: string): number | null | undefined {
  const v = texto(fd, k);
  if (v === "") return null;
  const n = Number(v);
  return Number.isInteger(n) && n >= 0 ? n : undefined;
}

function mensaje(error: { code?: string }, que: string) {
  return error.code === "23505" ? `Ya existe ${que} con ese nombre.` : "No se pudo guardar. Probá de nuevo.";
}

export async function guardarCategoria(_prev: FormState, fd: FormData): Promise<FormState> {
  if (!(await requireUser())) return { error: "Sin sesión." };

  const catId = id(fd);
  const nombre = texto(fd, "nombre");
  const color = texto(fd, "color");
  const precio = pesos(fd, "precio_referencia");
  if (!nombre) return { error: "Poné un nombre." };
  if (!COLOR.test(color)) return { error: "Elegí un color." };
  if (precio === undefined) return { error: "El precio de referencia debe ser un número entero." };

  const supabase = await createClient();
  const fila = { nombre, color, precio_referencia: precio };
  const res = catId
    ? await supabase.from("categorias").update({ ...fila, activa: fd.get("activa") === "on" }).eq("id", catId).select("id")
    : await supabase.from("categorias").insert(fila).select("id");

  if (res.error) return { error: mensaje(res.error, "una categoría") };
  if (!res.data?.length) return { error: "La categoría ya no existe." };

  revalidatePath("/ajustes");
  return { ok: true };
}

export async function guardarCombo(_prev: FormState, fd: FormData): Promise<FormState> {
  if (!(await requireUser())) return { error: "Sin sesión." };

  const comboId = id(fd);
  const nombre = texto(fd, "nombre");
  const precio = pesos(fd, "precio_referencia");
  const categorias = [...new Set(fd.getAll("categorias").map(Number))].filter(Number.isInteger);
  if (!nombre) return { error: "Poné un nombre." };
  if (precio == null) return { error: "Poné el precio del combo, en pesos y sin decimales." };
  if (categorias.length < 2) return { error: "Un combo incluye al menos dos categorías." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("guardar_combo", {
    p_id: comboId as number,
    p_nombre: nombre,
    p_precio: precio,
    p_activo: comboId ? fd.get("activo") === "on" : true,
    p_categorias: categorias,
  });

  if (error) return { error: mensaje(error, "un combo") };

  revalidatePath("/ajustes");
  return { ok: true };
}
