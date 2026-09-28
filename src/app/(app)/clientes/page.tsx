import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader, Placeholder } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { iniciales, matriculaSinEspacios } from "@/lib/dominio";
import { formatPesos } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { Buscador } from "./buscador";
import { ClienteEditor } from "./cliente-editor";

export const metadata: Metadata = { title: "Clientes" };

const sinTildes = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export default async function Page({ searchParams }: PageProps<"/clientes">) {
  if (!isSupabaseConfigured) {
    return (
      <>
        <PageHeader title="Clientes" />
        <Placeholder paso="Sin base de datos">Configurá Supabase en .env.local para ver los clientes.</Placeholder>
      </>
    );
  }
  await requireUser();

  const { q: qParam } = await searchParams;
  const q = (Array.isArray(qParam) ? qParam[0] : qParam)?.trim() ?? "";

  const supabase = await createClient();
  const [clientes, resumen] = await Promise.all([
    supabase.from("clientes").select("id, nombre, vehiculos(id, matricula, marca_modelo)").order("nombre"),
    supabase.from("v_clientes_resumen").select("cliente_id, facturado, visitas"),
  ]);
  if (clientes.error || resumen.error) throw new Error("No se pudieron leer los clientes.");

  const porCliente = new Map(resumen.data.map((r) => [r.cliente_id, r]));
  const lista = clientes.data.filter((c) => {
    if (!q) return true;
    return (
      sinTildes(c.nombre).includes(sinTildes(q)) || c.vehiculos.some((v) => matriculaSinEspacios(v.matricula).includes(matriculaSinEspacios(q)))
    );
  });

  return (
    <>
      <PageHeader title="Clientes">
        <ClienteEditor />
      </PageHeader>

      <Suspense>
        <Buscador />
      </Suspense>

      {lista.length ? (
        <ul className="grid grid-cols-1 gap-2.5 lg:grid-cols-2 xl:grid-cols-3">
          {lista.map((c) => {
            const r = porCliente.get(c.id);
            return (
              <li key={c.id}>
                <Link
                  href={`/clientes/${c.id}`}
                  className="flex items-center gap-3 rounded-xl border border-line bg-surface px-3.5 py-3 transition-colors hover:bg-raised"
                >
                  <span className="grid size-[42px] flex-none place-items-center rounded-full border border-line bg-raised font-display text-base font-bold text-brand">
                    {iniciales(c.nombre)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{c.nombre}</span>
                    <span className="block truncate text-[13px] text-muted">
                      {c.vehiculos.length ? c.vehiculos.map((v) => v.matricula || v.marca_modelo || "Sin matrícula").join(" · ") : "Sin vehículos"}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block font-display text-lg leading-none font-bold tracking-wide tabular-nums">
                      {formatPesos(r?.facturado ?? 0)}
                    </span>
                    <span className="text-[12px] text-muted tabular-nums">
                      {r?.visitas ?? 0} {r?.visitas === 1 ? "visita" : "visitas"}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed border-line p-6 text-center text-muted">
          {q ? `No hay clientes ni matrículas que coincidan con “${q}”.` : "Todavía no hay clientes. Creá el primero con “+ Cliente”."}
        </p>
      )}
    </>
  );
}
