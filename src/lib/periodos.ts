import { cap, nombreDia, nombreMes, numeroDia, rangoSemana, sumarDias, lunesDe } from "./agenda";

export const PERIODOS = [
  { id: "dia", etiqueta: "Día" },
  { id: "semana", etiqueta: "Semana" },
  { id: "mes", etiqueta: "Mes" },
  { id: "semestre", etiqueta: "Semestre" },
  { id: "año", etiqueta: "Año" },
] as const;
export type Periodo = (typeof PERIODOS)[number]["id"];

export const esPeriodo = (p: unknown): p is Periodo => PERIODOS.some((x) => x.id === p);

const iso = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d)).toISOString().slice(0, 10);
const partes = (f: string) => {
  const [y, m, d] = f.split("-").map(Number);
  return { y, m: m - 1, d };
};

export type Rango = {
  desde: string; // incluida
  hasta: string; // excluida
  etiqueta: string;
};

/** Rango de fechas (día local, `hasta` excluido) del período que contiene a `fecha`. */
export function rangoDe(periodo: Periodo, fecha: string): Rango {
  const { y, m } = partes(fecha);
  switch (periodo) {
    case "dia":
      return { desde: fecha, hasta: sumarDias(fecha, 1), etiqueta: `${cap(nombreDia(fecha))} ${numeroDia(fecha)} de ${nombreMes(fecha)}` };
    case "semana": {
      const l = lunesDe(fecha);
      return { desde: l, hasta: sumarDias(l, 7), etiqueta: rangoSemana(l) };
    }
    case "mes":
      return { desde: iso(y, m, 1), hasta: iso(y, m + 1, 1), etiqueta: `${cap(nombreMes(fecha))} ${y}` };
    case "semestre": {
      const h = m < 6 ? 0 : 6;
      return { desde: iso(y, h, 1), hasta: iso(y, h + 6, 1), etiqueta: `${h === 0 ? "1.er" : "2.º"} semestre ${y}` };
    }
    case "año":
      return { desde: iso(y, 0, 1), hasta: iso(y + 1, 0, 1), etiqueta: String(y) };
  }
}

/** Una fecha dentro del período anterior (k = -1) o siguiente (k = 1). */
export function desplazar(periodo: Periodo, fecha: string, k: number): string {
  const { y, m, d } = partes(fecha);
  switch (periodo) {
    case "dia":
      return sumarDias(fecha, k);
    case "semana":
      return sumarDias(fecha, 7 * k);
    case "mes":
      return iso(y, m + k, 1);
    case "semestre":
      return iso(y, m + 6 * k, 1);
    case "año":
      return iso(y + k, m, Math.min(d, 28));
  }
}

/** Nombre corto del período anterior, para frases como "contra la semana anterior". */
export const ANTERIOR: Record<Periodo, string> = {
  dia: "ayer",
  semana: "la semana anterior",
  mes: "el mes anterior",
  semestre: "el semestre anterior",
  año: "el año anterior",
};
