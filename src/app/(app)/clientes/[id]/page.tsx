import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EstadoPill } from "@/components/estado-pill";
import { requireUser } from "@/lib/auth";
import { diaLocal, formatFechaHora, iniciales, TAMANOS, type Tamano } from "@/lib/dominio";
import { formatPesos } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { ClienteEditor } from "../cliente-editor";
import { Copiar } from "../copiar";
import { VehiculoEditor } from "../vehiculo-editor";

export const metadata: Metadata = { title: "Ficha de cliente" };

export default async function Page({ params }: PageProps<"/clientes/[id]">) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!isSupabaseConfigured || !Number.isInteger(id)) notFound();
  await requireUser();

  const supabase = await createClient();
  const [cliente, vehiculos] = await Promise.all([
    supabase.from("clientes").select("id, nombre, telefono, notas").eq("id", id).maybeSingle(),
    supabase.from("vehiculos").select("id, matricula, marca_modelo, tamano").eq("cliente_id", id).order("matricula"),
  ]);
  if (cliente.error || vehiculos.error) throw new Error("No se pudo leer el cliente.");
  if (!cliente.data) notFound();

  const turnos = vehiculos.data.length
    ? await supabase
        .from("turnos")
        .select("id, inicio, estado, medio_pago, vehiculo_id, turno_items(precio_cobrado, categorias(nombre, color), combos(nombre))")
        .in(
          "vehiculo_id",
          vehiculos.data.map((v) => v.id),
        )
        .order("inicio", { ascending: false })
    : { data: [], error: null };
  if (turnos.error) throw new Error("No se pudo leer el historial.");

  const conTotal = turnos.data.map((t) => ({ ...t, total: t.turno_items.reduce((s, i) => s + i.precio_cobrado, 0) }));
  const realizados = conTotal.filter((t) => t.estado === "realizado");
  const facturado = realizados.reduce((s, t) => s + t.total, 0);
  const ultima = realizados[0];
  const c = cliente.data;

  return (
    <>
      <div>
        <Link href="/clientes" className="inline-flex min-h-9 items-center rounded-[10px] border border-line bg-raised px-3 text-sm font-semibold">
          ‹ Clientes
        </Link>
      </div>

      <section className="flex flex-col gap-4 rounded-[14px] border border-line bg-surface p-4">
        <div className="flex items-center gap-3">
          <span className="grid size-[52px] flex-none place-items-center rounded-full border border-line bg-raised font-display text-xl font-bold text-brand">
            {iniciales(c.nombre)}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-[26px] leading-none font-bold tracking-wide uppercase">{c.nombre}</h1>
            <p className="mt-1 text-sm text-muted tabular-nums select-all">{c.telefono || "Sin teléfono"}</p>
          </div>
          <div className="flex flex-none gap-2">
            {c.telefono && <Copiar texto={c.telefono} />}
            <ClienteEditor cliente={c} />
          </div>
        </div>
        {c.notas && <p className="text-[13px] text-muted">{c.notas}</p>}
        <div className="grid grid-cols-3 gap-2.5">
          <Kpi etiqueta="Facturado" valor={formatPesos(facturado)} />
          <Kpi etiqueta="Visitas" valor={String(realizados.length)} />
          <Kpi etiqueta="Última visita" valor={ultima ? formatFechaHora(ultima.inicio).split(" · ")[0] : "—"} chico />
        </div>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        {vehiculos.data.map((v) => {
          const historial = conTotal.filter((t) => t.vehiculo_id === v.id);
          return (
            <section key={v.id} className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="min-w-0 font-display text-lg leading-none font-bold tracking-wide uppercase">
                  {v.matricula}
                  <span className="ml-2 font-sans text-[13px] font-normal tracking-normal text-muted normal-case">
                    {v.marca_modelo || "Sin modelo"} · {TAMANOS[v.tamano as Tamano] ?? v.tamano}
                  </span>
                </h2>
                <VehiculoEditor clienteId={c.id} vehiculo={v} />
              </div>
              {historial.length ? (
                historial.map((t) => (
                  <article
                    key={t.id}
                    className={`flex items-start gap-3 rounded-xl border border-line bg-surface px-3.5 py-3 ${t.estado === "cancelado" ? "opacity-55" : ""}`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] text-muted" title={diaLocal(t.inicio)}>
                        {formatFechaHora(t.inicio)}
                      </p>
                      <ul className="mt-1 flex flex-col gap-0.5 text-sm">
                        {t.turno_items.map((i, n) => {
                          const nombre = i.combos?.nombre ?? i.categorias?.nombre ?? "Servicio";
                          return (
                            <li key={n} className="flex items-center gap-2">
                              <span className="size-[9px] flex-none rounded-full" style={{ backgroundColor: i.categorias?.color ?? "#8c919c" }} />
                              {nombre}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className={`font-display text-lg leading-none font-bold tabular-nums ${t.estado === "cancelado" ? "line-through" : ""}`}>
                        {formatPesos(t.total)}
                      </span>
                      <EstadoPill estado={t.estado} />
                    </div>
                  </article>
                ))
              ) : (
                <p className="rounded-xl border border-dashed border-line p-4 text-center text-sm text-muted">Sin historial todavía.</p>
              )}
            </section>
          );
        })}
        <div className="lg:col-span-2">
          <VehiculoEditor clienteId={c.id} />
        </div>
      </div>
    </>
  );
}

function Kpi({ etiqueta, valor, chico }: { etiqueta: string; valor: string; chico?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-[10px] bg-raised p-3">
      <span className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">{etiqueta}</span>
      <b className={`font-display leading-none tabular-nums ${chico ? "text-lg" : "text-2xl"}`}>{valor}</b>
    </div>
  );
}
