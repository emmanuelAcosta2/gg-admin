import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader, Placeholder } from "@/components/page-header";
import { CatalogoProvider } from "@/components/turnos/catalogo";
import { TurnoCard } from "@/components/turnos/turno-card";
import { cap, fechaValida, hoyLocal, nombreDiaCorto, nombreMes, numeroDia } from "@/lib/agenda";
import { requireUser } from "@/lib/auth";
import { cargarCatalogo, turnosPorIds } from "@/lib/data/turnos";
import { formatPesos } from "@/lib/format";
import { desplazar, esPeriodo, PERIODOS, rangoDe, type Periodo } from "@/lib/periodos";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { Filtro } from "./filtro";

export const metadata: Metadata = { title: "Registro" };

const INICIAL = 10;
const INCREMENTO = 20;
const MAX = 600;

type Resultado = { cantidad: number; total: number; ids: number[] };

export default async function Page({ searchParams }: PageProps<"/registro">) {
  if (!isSupabaseConfigured) {
    return (
      <>
        <PageHeader title="Registro" />
        <Placeholder paso="Sin base de datos">Configurá Supabase en .env.local para ver el registro.</Placeholder>
      </>
    );
  }
  await requireUser();

  const sp = await searchParams;
  const un = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const hoy = hoyLocal();
  const periodo: Periodo = esPeriodo(un(sp.periodo)) ? (un(sp.periodo) as Periodo) : "mes";
  const fecha = fechaValida(un(sp.fecha), hoy);
  const rango = rangoDe(periodo, fecha);
  const filtro = /^(cat|combo):\d+$/.test(un(sp.filtro) ?? "") ? un(sp.filtro)! : "";
  const [tipoFiltro, idFiltro] = filtro ? filtro.split(":") : [];
  const limite = Math.min(Math.max(Number(un(sp.limite)) || INICIAL, INICIAL), MAX);

  const supabase = await createClient();
  const [reg, categorias, combos] = await Promise.all([
    supabase.rpc("registro_turnos", {
      p_desde: rango.desde,
      p_hasta: rango.hasta,
      p_categoria: (tipoFiltro === "cat" ? Number(idFiltro) : null) as number,
      p_combo: (tipoFiltro === "combo" ? Number(idFiltro) : null) as number,
      p_limite: limite,
      p_desplazamiento: 0,
    }),
    supabase.from("categorias").select("id, nombre").order("nombre"),
    supabase.from("combos").select("id, nombre").order("nombre"),
  ]);
  if (reg.error) throw new Error(`No se pudo leer el registro: ${reg.error.message}`);
  if (categorias.error || combos.error) throw new Error("No se pudieron leer las categorías y los combos.");

  const { cantidad, total, ids } = reg.data as unknown as Resultado;
  const [turnos, catalogo] = await Promise.all([turnosPorIds(supabase, ids), cargarCatalogo(supabase, hoy)]);

  const href = (parcial: { periodo?: Periodo; fecha?: string; limite?: number }) => {
    const p = new URLSearchParams({ periodo: parcial.periodo ?? periodo, fecha: parcial.fecha ?? fecha });
    if (filtro) p.set("filtro", filtro);
    if (parcial.limite) p.set("limite", String(parcial.limite));
    return `/registro?${p.toString()}`;
  };

  const porDia = new Map<string, typeof turnos>();
  for (const t of turnos) porDia.set(t.dia, [...(porDia.get(t.dia) ?? []), t]);

  const esActual = rango.desde <= hoy && hoy < rango.hasta;

  return (
    <CatalogoProvider catalogo={catalogo}>
      <PageHeader title="Registro" />

      <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] lg:mx-0 lg:px-0" aria-label="Período">
        {PERIODOS.map((p) => (
          <Link
            key={p.id}
            href={href({ periodo: p.id })}
            aria-current={p.id === periodo ? "page" : undefined}
            className="flex-none rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm font-semibold text-muted aria-[current=page]:border-fg aria-[current=page]:bg-fg aria-[current=page]:text-canvas"
          >
            {p.etiqueta}
          </Link>
        ))}
      </nav>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex items-center gap-2">
          <Link href={href({ fecha: desplazar(periodo, fecha, -1) })} aria-label="Período anterior" className="grid size-10 place-items-center rounded-[10px] border border-line bg-surface">
            ‹
          </Link>
          <span className="min-w-[9.5rem] text-center font-display text-lg font-bold tracking-wide uppercase">{rango.etiqueta}</span>
          <Link href={href({ fecha: desplazar(periodo, fecha, 1) })} aria-label="Período siguiente" className="grid size-10 place-items-center rounded-[10px] border border-line bg-surface">
            ›
          </Link>
          {!esActual && (
            <Link href={href({ fecha: hoy })} className="inline-flex min-h-10 items-center rounded-[10px] border border-line bg-surface px-3 text-sm font-semibold">
              Hoy
            </Link>
          )}
        </div>
        <div className="basis-full lg:basis-auto">
          <Suspense>
            <Filtro categorias={categorias.data} combos={combos.data} valor={filtro} />
          </Suspense>
        </div>
      </div>

      <section className="flex items-end justify-between gap-3 rounded-[14px] border border-line bg-surface p-4">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">Facturado · {rango.etiqueta}</p>
          <p className="mt-2 font-display text-[44px] leading-none font-bold tabular-nums">{formatPesos(total)}</p>
        </div>
        <p className="text-right text-sm text-muted tabular-nums">
          {cantidad} {cantidad === 1 ? "trabajo" : "trabajos"}
        </p>
      </section>
      {tipoFiltro === "cat" && (
        <p className="text-[13px] text-muted">
          Incluye los trabajos donde esta categoría vino dentro de un combo. El importe es el de cada turno completo, no solo el de esta categoría.
        </p>
      )}

      {turnos.length ? (
        <div className="flex flex-col gap-5">
          {[...porDia].map(([dia, ts]) => (
            <section key={dia} className="flex flex-col gap-2.5">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-display text-lg leading-none font-bold tracking-wide uppercase">
                  {cap(nombreDiaCorto(dia))} {numeroDia(dia)} {nombreMes(dia).slice(0, 3)}
                </h2>
                <span className="text-[13px] text-muted tabular-nums">{formatPesos(ts.reduce((s, t) => s + t.total, 0))}</span>
              </div>
              <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
                {ts.map((t) => (
                  <TurnoCard key={t.id} turno={t} />
                ))}
              </div>
            </section>
          ))}
          {cantidad > turnos.length && limite < MAX && (
            <Link
              href={href({ limite: limite + INCREMENTO })}
              scroll={false}
              className="inline-flex min-h-11 items-center justify-center rounded-[10px] border border-line bg-raised px-4 font-semibold lg:self-start"
            >
              Ver más ({cantidad - turnos.length} restantes)
            </Link>
          )}
          {cantidad > turnos.length && limite >= MAX && (
            <p className="text-[13px] text-muted">Se muestran los {turnos.length} más recientes. Acotá el período o el filtro para ver el resto.</p>
          )}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-line p-7 text-center text-muted">No hay trabajos realizados con estos filtros.</p>
      )}
    </CatalogoProvider>
  );
}
