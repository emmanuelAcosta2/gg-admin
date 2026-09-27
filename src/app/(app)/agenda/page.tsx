import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, Placeholder } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import {
  cap,
  coloresDelTurno,
  fechaLarga,
  fechaValida,
  hoyLocal,
  lunesDe,
  nombreDia,
  nombreDiaCorto,
  numeroDia,
  rangoSemana,
  sumarDias,
} from "@/lib/agenda";
import { cargarCatalogo, turnosEnRango } from "@/lib/data/turnos";
import { formatPesos } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { CatalogoProvider } from "@/components/turnos/catalogo";
import { NuevoTurno } from "./nuevo-turno";
import { TurnoCard } from "@/components/turnos/turno-card";

export const metadata: Metadata = { title: "Agenda" };

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
  const [turnos, catalogo] = await Promise.all([turnosEnRango(supabase, lunes, sumarDias(lunes, 7)), cargarCatalogo(supabase, hoy)]);

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
            <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
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
