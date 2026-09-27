import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, Placeholder } from "@/components/page-header";
import { Delta } from "@/components/delta";
import { Kpi } from "@/components/kpi";
import { fechaValida, hoyLocal } from "@/lib/agenda";
import { requireUser } from "@/lib/auth";
import { formatPesos } from "@/lib/format";
import {
  ANTERIOR,
  bucketsDe,
  desplazar,
  esPeriodo,
  PERIODOS,
  rangoDe,
  type Periodo,
} from "@/lib/periodos";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Reportes" };

type Rubro = {
  tipo: "categoria" | "combo";
  id: number;
  nombre: string;
  colores: string[];
  monto: number;
};
type CategoriaConteo = {
  id: number;
  nombre: string;
  color: string;
  sueltos: number;
  combo: number;
  via: { nombre: string; cantidad: number }[];
};
type Detalle = { categorias: CategoriaConteo[]; rubros: Rubro[] };

async function totalYCantidad(
  supabase: Awaited<ReturnType<typeof createClient>>,
  desde: string,
  hasta: string,
) {
  const { data, error } = await supabase
    .from("v_turnos_total")
    .select("total")
    .eq("estado", "realizado")
    .gte("fecha", desde)
    .lt("fecha", hasta);
  if (error)
    throw new Error(`No se pudo leer la facturación: ${error.message}`);
  const total = data.reduce((s, t) => s + (t.total ?? 0), 0);
  return {
    total,
    cantidad: data.length,
    promedio: data.length ? total / data.length : 0,
  };
}

export default async function Page({ searchParams }: PageProps<"/reportes">) {
  if (!isSupabaseConfigured) {
    return (
      <>
        <PageHeader title="Reportes" />
        <Placeholder paso="Sin base de datos">
          Configurá Supabase en .env.local para ver los reportes.
        </Placeholder>
      </>
    );
  }
  await requireUser();

  const sp = await searchParams;
  const un = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;
  const hoy = hoyLocal();
  const periodo: Periodo = esPeriodo(un(sp.periodo))
    ? (un(sp.periodo) as Periodo)
    : "mes";
  const fecha = fechaValida(un(sp.fecha), hoy);
  const rango = rangoDe(periodo, fecha);
  const rangoAnterior = rangoDe(periodo, desplazar(periodo, fecha, -1));

  const supabase = await createClient();
  const [actual, anterior, detalleRes] = await Promise.all([
    totalYCantidad(supabase, rango.desde, rango.hasta),
    totalYCantidad(supabase, rangoAnterior.desde, rangoAnterior.hasta),
    supabase.rpc("reporte_detalle", {
      p_desde: rango.desde,
      p_hasta: rango.hasta,
    }),
  ]);
  if (detalleRes.error)
    throw new Error(`No se pudo leer el detalle: ${detalleRes.error.message}`);
  const { categorias, rubros } = detalleRes.data as unknown as Detalle;

  const buckets = bucketsDe(periodo, rango);
  let bars: { label: string; monto: number }[] = [];
  if (buckets.length) {
    const { data, error } = await supabase
      .from("v_turnos_total")
      .select("fecha, total")
      .eq("estado", "realizado")
      .gte("fecha", rango.desde)
      .lt("fecha", rango.hasta);
    if (error) throw new Error(`No se pudo leer el gráfico: ${error.message}`);
    bars = buckets.map((b) => ({
      label: b.label,
      monto: data
        .filter((t) => t.fecha && t.fecha >= b.desde && t.fecha < b.hasta)
        .reduce((s, t) => s + (t.total ?? 0), 0),
    }));
  }
  const maxBar = Math.max(1, ...bars.map((b) => b.monto));

  const href = (parcial: { periodo?: Periodo; fecha?: string }) =>
    `/reportes?periodo=${parcial.periodo ?? periodo}&fecha=${parcial.fecha ?? fecha}`;
  const esActual = rango.desde <= hoy && hoy < rango.hasta;
  const maxCategoria = Math.max(
    1,
    ...categorias.map((c) => c.sueltos + c.combo),
  );
  const maxRubro = Math.max(1, ...rubros.map((r) => r.monto));

  return (
    <>
      <PageHeader title="Reportes" />

      <nav
        className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] lg:mx-0 lg:px-0"
        aria-label="Período"
      >
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

      <div className="flex items-center gap-2">
        <Link
          href={href({ fecha: desplazar(periodo, fecha, -1) })}
          aria-label="Período anterior"
          className="grid size-10 flex-none place-items-center rounded-[10px] border border-line bg-surface"
        >
          ‹
        </Link>
        <span className="min-w-[9.5rem] flex-1 text-center font-display text-lg font-bold tracking-wide uppercase lg:flex-none">
          {rango.etiqueta}
        </span>
        <Link
          href={href({ fecha: desplazar(periodo, fecha, 1) })}
          aria-label="Período siguiente"
          className="grid size-10 flex-none place-items-center rounded-[10px] border border-line bg-surface"
        >
          ›
        </Link>
        {!esActual && (
          <Link
            href={href({ fecha: hoy })}
            className="inline-flex min-h-10 flex-none items-center rounded-[10px] border border-line bg-surface px-3 text-sm font-semibold"
          >
            Hoy
          </Link>
        )}
      </div>

      <section className="flex flex-col gap-4 rounded-[14px] border border-line bg-surface p-4">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">
            Facturación · {rango.etiqueta}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="font-display text-[44px] leading-none font-bold tabular-nums">
              {formatPesos(actual.total)}
            </span>
            <Delta actual={actual.total} anterior={anterior.total} />
          </div>
          <p className="mt-1 text-[13px] text-muted">
            {anterior.total
              ? `Contra ${ANTERIOR[periodo]}: ${formatPesos(anterior.total)}`
              : `Sin turnos realizados en ${ANTERIOR[periodo]}.`}
          </p>
        </div>

        {bars.length > 0 && (
          <div>
            <div
              role="img"
              aria-label={`Facturación por ${periodo === "semestre" || periodo === "año" ? "mes" : "día"}`}
              className="flex h-24 items-end gap-[3px] border-b border-line"
            >
              {bars.map((b, i) => (
                <i
                  key={i}
                  className={`min-h-[2px] flex-1 rounded-t-[2px] ${b.monto ? "bg-brand opacity-90" : "bg-line"}`}
                  style={{
                    height: `${Math.max(2, (b.monto / maxBar) * 100)}%`,
                  }}
                />
              ))}
            </div>
            <div
              aria-hidden="true"
              className="mt-1 flex gap-[3px] text-[10px] font-medium text-muted"
            >
              {bars.map((b, i) => (
                <span
                  key={i}
                  className="flex-1 text-center whitespace-nowrap tabular-nums"
                >
                  {b.label}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2.5">
          <Kpi etiqueta="Turnos realizados" valor={String(actual.cantidad)}>
            <Delta actual={actual.cantidad} anterior={anterior.cantidad} />
          </Kpi>
          <Kpi etiqueta="Ticket promedio" valor={formatPesos(actual.promedio)}>
            <Delta actual={actual.promedio} anterior={anterior.promedio} />
          </Kpi>
        </div>
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-2">
        <section className="flex flex-col gap-3 rounded-[14px] border border-line bg-surface p-4">
          <div>
            <h2 className="font-display text-lg leading-none font-bold tracking-wide uppercase">
              Servicios realizados
            </h2>
            <p className="mt-1.5 text-[13px] text-muted">
              Suma los servicios sueltos y los incluidos en combos.
            </p>
          </div>
          {categorias.length ? (
            <div className="flex flex-col gap-3.5">
              {categorias.map((c) => {
                const n = c.sueltos + c.combo;
                return (
                  <div key={c.id} className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="size-[9px] flex-none rounded-full"
                        style={{ backgroundColor: c.color }}
                      />
                      <span className="min-w-0 flex-1 truncate font-semibold">
                        {c.nombre}
                      </span>
                      <span className="font-display text-xl leading-none font-bold tabular-nums">
                        {n}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-raised">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(n / maxCategoria) * 100}%`,
                          backgroundColor: c.color,
                        }}
                      />
                    </div>
                    <p className="text-[13px] text-muted tabular-nums">
                      {c.sueltos} sueltos + {c.combo} en combo
                      {c.via.length > 0 && (
                        <>
                          {" "}
                          ·{" "}
                          {c.via
                            .map((v) => `${v.nombre} ×${v.cantidad}`)
                            .join(", ")}
                        </>
                      )}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-line p-5 text-center text-muted">
              Sin servicios realizados en este período.
            </p>
          )}
        </section>

        <section className="flex flex-col gap-3 rounded-[14px] border border-line bg-surface p-4">
          <div>
            <h2 className="font-display text-lg leading-none font-bold tracking-wide uppercase">
              Facturación por rubro
            </h2>
            <p className="mt-1.5 text-[13px] text-muted">
              Cada combo es un rubro propio: su monto no se reparte entre las
              categorías que incluye.
            </p>
          </div>
          {rubros.length ? (
            <div className="flex flex-col gap-3.5">
              {rubros.map((r) => (
                <div
                  key={`${r.tipo}-${r.id}`}
                  className="flex flex-col gap-1.5"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex flex-none gap-0.5">
                      {r.colores.map((c, i) => (
                        <span
                          key={i}
                          className="size-[9px] rounded-full"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-semibold">
                      {r.nombre}
                    </span>
                    {r.tipo === "combo" && (
                      <span className="rounded bg-raised px-1.5 py-[3px] text-[10px] font-semibold tracking-[0.1em] text-muted uppercase">
                        Combo
                      </span>
                    )}
                    <span className="font-display text-lg leading-none font-bold tabular-nums">
                      {formatPesos(r.monto)}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-raised">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(r.monto / maxRubro) * 100}%`,
                        backgroundColor:
                          r.tipo === "combo" ? "var(--color-fg)" : r.colores[0],
                        opacity: r.tipo === "combo" ? 0.75 : 1,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-line p-5 text-center text-muted">
              Sin facturación en este período.
            </p>
          )}
        </section>
      </div>
    </>
  );
}
