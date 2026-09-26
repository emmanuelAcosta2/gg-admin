import type { Metadata } from "next";
import Image from "next/image";
import { PageHeader, Placeholder } from "@/components/page-header";
import { signOut } from "@/app/login/actions";
import { requireUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { CategoriaEditor } from "./categoria-editor";
import { ComboEditor } from "./combo-editor";

export const metadata: Metadata = { title: "Ajustes" };

export default async function Page() {
  if (!isSupabaseConfigured) {
    return (
      <>
        <PageHeader title="Ajustes" />
        <Placeholder paso="Sin base de datos">Configurá Supabase en .env.local para administrar categorías y combos.</Placeholder>
      </>
    );
  }

  const user = await requireUser();
  const supabase = await createClient();
  const [categorias, combos] = await Promise.all([
    supabase.from("categorias").select("id, nombre, color, precio_referencia, activa").order("activa", { ascending: false }).order("nombre"),
    supabase
      .from("combos")
      .select("id, nombre, precio_referencia, activo, combo_categorias(categoria_id)")
      .order("activo", { ascending: false })
      .order("nombre"),
  ]);

  if (categorias.error || combos.error) {
    throw new Error("No se pudieron leer las categorías y los combos.");
  }

  const combosVista = combos.data.map(({ combo_categorias, ...c }) => ({
    ...c,
    categoriaIds: combo_categorias.map((x) => x.categoria_id),
  }));

  return (
    <>
      <PageHeader title="Ajustes" />

      <div className="grid items-start gap-8 lg:grid-cols-2">
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg leading-none font-bold tracking-wide uppercase">Categorías de servicio</h2>
            <CategoriaEditor enUso={categorias.data} />
          </div>
          {categorias.data.length ? (
            categorias.data.map((c) => <CategoriaEditor key={c.id} categoria={c} enUso={categorias.data} />)
          ) : (
            <p className="rounded-xl border border-dashed border-line p-5 text-center text-muted">
              Todavía no hay categorías. Creá la primera con “+ Nueva”.
            </p>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg leading-none font-bold tracking-wide uppercase">Combos</h2>
            <ComboEditor categorias={categorias.data} />
          </div>
          {combosVista.length ? (
            combosVista.map((c) => <ComboEditor key={c.id} combo={c} categorias={categorias.data} />)
          ) : (
            <p className="rounded-xl border border-dashed border-line p-5 text-center text-muted">
              Todavía no hay combos. Un combo agrupa dos o más categorías con un precio propio.
            </p>
          )}
        </section>
      </div>

      <section className="flex flex-col gap-4 rounded-[14px] border border-line bg-surface p-4">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">Marcas del taller</p>
        <div className="flex items-center gap-4">
          <Image src="/logo-gg.png" alt="" width={64} height={64} className="size-16 rounded-full" />
          <Image src="/logo-germino.png" alt="" width={64} height={64} className="size-16 rounded-full" />
          <p className="text-[13px] text-muted">GG Lavadero y Detailing y Germino Alineaciones comparten esta agenda y esta facturación.</p>
        </div>
      </section>

      <section className="flex items-center justify-between gap-3 rounded-[14px] border border-line bg-surface p-4 lg:hidden">
        <span className="min-w-0 truncate text-[13px] text-muted">{user?.email}</span>
        <form action={signOut}>
          <button className="min-h-9 rounded-[10px] border border-line bg-raised px-3 text-sm font-semibold">Salir</button>
        </form>
      </section>
    </>
  );
}
