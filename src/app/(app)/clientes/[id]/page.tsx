import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Kpi } from "@/components/kpi";
import { requireUser } from "@/lib/auth";
import { formatFechaHora, iniciales, TAMANOS, type Tamano } from "@/lib/dominio";
import { formatPesos } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { ClienteEditor } from "../cliente-editor";
import { Copiar } from "../copiar";
import { VehiculoEditor } from "../vehiculo-editor";
import { Historial } from "./historial";

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
        .select("id, inicio, estado, medio_pago, vehiculo_id, turno_items(precio_cobrado, categorias!categoria_id(nombre, color), combos!combo_id(nombre), turno_item_categorias(categorias(color)))")
        .in(
          "vehiculo_id",
          vehiculos.data.map((v) => v.id),
        )
        .order("inicio", { ascending: false })
    : { data: [], error: null };
  if (turnos.error) throw new Error(`No se pudo leer el historial: ${turnos.error.message}`);

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

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-lg leading-none font-bold tracking-wide uppercase">Vehículos</h2>
          <VehiculoEditor clienteId={c.id} />
        </div>
        <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2 xl:grid-cols-3">
          {vehiculos.data.map((v) => {
            const propios = realizados.filter((t) => t.vehiculo_id === v.id);
            return (
              <div key={v.id} className="flex items-center gap-3 rounded-xl border border-line bg-surface px-3.5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg leading-none font-bold tracking-wide uppercase">{v.matricula || "Sin matrícula"}</p>
                  <p className="mt-1 truncate text-[13px] text-muted">
                    {v.marca_modelo || "Sin modelo"} · {TAMANOS[v.tamano as Tamano] ?? v.tamano}
                  </p>
                  <p className="mt-0.5 text-[12px] text-muted tabular-nums">
                    {propios.length} {propios.length === 1 ? "visita" : "visitas"} · {formatPesos(propios.reduce((s, t) => s + t.total, 0))}
                  </p>
                </div>
                <VehiculoEditor clienteId={c.id} vehiculo={v} />
              </div>
            );
          })}
          {!vehiculos.data.length && (
            <p className="rounded-xl border border-dashed border-line p-4 text-center text-sm text-muted lg:col-span-2 xl:col-span-3">
              Este cliente todavía no tiene vehículos. Agregá el primero con “+ Vehículo”.
            </p>
          )}
        </div>
      </section>

      <Historial
        vehiculos={vehiculos.data.map((v) => ({ id: v.id, matricula: v.matricula, marca_modelo: v.marca_modelo }))}
        turnos={conTotal.map((t) => ({
          id: t.id,
          vehiculoId: t.vehiculo_id,
          fecha: formatFechaHora(t.inicio),
          estado: t.estado,
          total: formatPesos(t.total),
          items: t.turno_items.map((i) => ({
            nombre: i.combos?.nombre ?? i.categorias?.nombre ?? "Servicio",
            colores: (i.combos ? i.turno_item_categorias.map((x) => x.categorias?.color) : [i.categorias?.color]).map((c) => c ?? "#8c919c"),
          })),
        }))}
      />
    </>
  );
}
