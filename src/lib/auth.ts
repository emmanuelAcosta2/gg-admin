import "server-only";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "./supabase/config";
import { createClient } from "./supabase/server";

/** Usuario actual, o null. Sin Supabase configurado devuelve null (modo diseño). */
export async function getUser() {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

/** Llamar al inicio de cada página con datos y de cada Server Action. */
export async function requireUser() {
  if (!isSupabaseConfigured) return null;
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}
