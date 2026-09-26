import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, Placeholder } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import {
  aInstante,
  cap,
  coloresDelTurno,
  fechaLarga,
  fechaValida,
  horaLocal,
  hoyLocal,
  lunesDe,
  nombreDia,
  nombreDiaCorto,
  numeroDia,
  rangoSemana,
  sumarDias,
  type TurnoVista,
} from "@/lib/agenda";
import { diaLocal, formatFechaHora } from "@/lib/dominio";
import { formatPesos } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { CatalogoProvider } from "./catalogo";
import { NuevoTurno } from "./nuevo-turno";
import { TurnoCard } from "./turno-card";

export const metadata: Metadata = { title: "Agenda" };

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

export default async function Page({ searchParams }: PageProps<"/agenda">) {
  if (!isSupabaseConfigured) {
    return (
      <>
        <PageHeader title="Agenda" />
        <Placeholder paso="Sin base de datos">Configurá Supabase en .env.local para ver la agenda.</Placeholder>
      </>
    );
  }
  await requireUser();

  const sp = await searchParams;
  const un = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const hoy = hoyLocal();
  const sel = fechaValida(un(sp.fecha), hoy);
  const semana = un(sp.vista) === "semana";
  const lunes = lunesDe(sel);
  const dias = Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i));

  const supabase = await createClient();
  const [turnosRes, categoriasRes, combosRes, vehiculosRes, clientesRes] = await Promise.all([
    supabase
      .from("turnos")
      .select(SELECT_TURNOS)
      .gte("inicio", aInstante(lunes, "00:00"))
      .lt("inicio", aInstante(sumarDias(lunes, 7), "00:00"))
      .order("inicio"),
    supabase.from("categorias").select("id, nombre, color, precio_referencia").eq("activa", true).order("nombre"),
    supabase.from("combos").select("id, nombre, precio_referencia, combo_categorias ( categorias ( color ) )").eq("activo", true).order("nombre"),
    supabase.from("vehiculos").select("id, matricula, marca_modelo, tamano, cliente_id, clientes ( nombre )").order("matricula"),
    supabase.from("clientes").select("id, nombre").order("nombre"),
  ]);
  for (const r of [turnosRes, categoriasRes, combosRes, vehiculosRes, clientesRes]) {
    if (r.error) throw new Error(`No se pudo leer la agenda: ${r.error.message}`);
  }

  const turnos: TurnoVista[] = turnosRes.data!.map((t) => {
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
  });

  const catalogo = {
    hoy,
    categorias: categoriasRes.data!.map((c) => ({ id: c.id, nombre: c.nombre, color: c.color, precio: c.precio_referencia })),
    combos: combosRes.data!.map((c) => ({
      id: c.id,
      nombre: c.nombre,
      precio: c.precio_referencia,
      colores: c.combo_categorias.map((x) => x.categorias?.color).filter((x) => x !== undefined),
    })),
    vehiculos: vehiculosRes.data!.map((v) => ({
      id: v.id,
      matricula: v.matricula,
      modelo: v.marca_modelo,
      tamano: v.tamano,
      cliente: v.clientes?.nombre ?? "",
      clienteId: v.cliente_id,
    })),
    clientes: clientesRes.data!,
  };

  const porDia = new Map(dias.map((d) => [d, turnos.filter((t) => t.dia === d)]));
  const href = (fecha: string, vista = semana ? "semana" : "dia") => `/agenda?vista=${vista}&fecha=${fecha}`;

  const delDia = porDia.get(sel) ?? [];
  const cobrado = delDia.filter((t) => t.estado === "realizado").reduce((s, t) => s + t.total, 0);
  const pendientes = delDia.filter((t) => t.estado === "agendado").length;

  return (
    <CatalogoProvider catalogo={catalogo}>
      <PageHeader title="Agenda">
        <div className="inline-flex gap-0.5 rounded-[10px] border border-line bg-surface p-[3px]" role="group" aria-label="Vista">
          {(["dia", "semana"] as const).map((v) => (
            <Link
              key={v}
              href={href(sel, v)}
              aria-current={(v === "semana") === semana ? "page" : undefined}
              className="rounded-[7px] px-3.5 py-1.5 text-sm font-semibold text-muted aria-[current=page]:bg-raised aria-[current=page]:text-fg aria-[current=page]:shadow-[inset_0_0_0_1px_var(--color-line)]"
            >
              {v === "dia" ? "Día" : "Semana"}
            </Link>
          ))}
        </div>
      </PageHeader>

      <div className="flex items-center gap-2 lg:max-w-2xl">
        <Link href={href(sumarDias(sel, -7))} aria-label="Semana anterior" className="grid size-10 flex-none place-items-center rounded-[10px] border border-line bg-surface">
          ‹
        </Link>
        <div className="grid flex-1 grid-cols-7 gap-1">
          {dias.map((d) => {
            const colores = [...new Set((porDia.get(d) ?? []).filter((t) => t.estado !== "cancelado").flatMap(coloresDelTurno))].slice(0, 5);
            const activo = !semana && d === sel;
            return (
              <Link
                key={d}
                href={href(d, "dia")}
                aria-current={activo ? "date" : undefined}
                aria-label={`${nombreDia(d)} ${numeroDia(d)}`}
                className={`flex flex-col items-center gap-1 rounded-[10px] border px-0 pt-2 pb-1.5 ${activo ? "border-line bg-raised" : "border-transparent"}`}
              >
                <span className="text-[10px] font-semibold tracking-[0.1em] text-muted uppercase">{nombreDiaCorto(d)}</span>
                <b className={`font-display text-xl leading-none tabular-nums ${d === hoy ? "text-brand" : ""}`}>{numeroDia(d)}</b>
                <span className="flex h-[5px] gap-0.5" aria-hidden="true">
                  {colores.map((c) => (
                    <i key={c} className="size-[5px] rounded-full" style={{ backgroundColor: c }} />
                  ))}
                </span>
              </Link>
            );
          })}
        </div>
        <Link href={href(sumarDias(sel, 7))} aria-label="Semana siguiente" className="grid size-10 flex-none place-items-center rounded-[10px] border border-line bg-surface">
          ›
        </Link>
        {sel !== hoy && (
          <Link href={href(hoy)} className="hidden min-h-10 flex-none items-center rounded-[10px] border border-line bg-surface px-3 text-sm font-semibold lg:flex">
            Hoy
          </Link>
        )}
      </div>

      {!semana ? (
        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-lg leading-none font-bold tracking-wide uppercase">{fechaLarga(sel)}</h2>
            <span className="text-[13px] text-muted tabular-nums">
              {pendientes} agendados · {formatPesos(cobrado)} cobrado
            </span>
          </div>
          {delDia.length ? (
            <div className="grid gap-2.5 lg:grid-cols-2">
              {delDia.map((t) => (
                <TurnoCard key={t.id} turno={t} />
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-line p-7 text-center text-muted">
              No hay turnos este día.
              <br />
              Tocá “+ Turno” para agendar.
            </p>
          )}
        </section>
      ) : (
        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-lg leading-none font-bold tracking-wide uppercase">{rangoSemana(lunes)}</h2>
            <span className="text-[13px] text-muted tabular-nums">
              {turnos.filter((t) => t.estado === "agendado").length} agendados
            </span>
          </div>
          <div className="flex flex-col gap-4 lg:grid lg:grid-cols-7 lg:items-start lg:gap-2.5">
            {dias.map((d) => {
              const ts = porDia.get(d) ?? [];
              return (
                <div key={d} className="flex flex-col gap-2 lg:min-h-44 lg:rounded-[14px] lg:border lg:border-line lg:bg-surface lg:p-2.5">
                  <div className="flex items-baseline justify-between lg:flex-col lg:items-start lg:gap-1">
                    <Link href={href(d, "dia")} className={`font-display text-lg leading-none font-bold tracking-wide uppercase ${d === hoy ? "text-brand" : ""}`}>
                      {cap(nombreDia(d))} {numeroDia(d)}
                    </Link>
                    <span className="text-[13px] text-muted">{ts.length ? `${ts.length} turnos` : "Libre"}</span>
                  </div>
                  {ts.map((t) => (
                    <TurnoCard key={t.id} turno={t} fila />
                  ))}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <NuevoTurno fecha={sel} />
    </CatalogoProvider>
  );
}
