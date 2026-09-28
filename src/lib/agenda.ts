import { diaLocal } from "./dominio";

/** Uruguay no usa horario de verano desde 2015: Montevideo es siempre UTC-3. */
const OFFSET = "-03:00";

const hora = new Intl.DateTimeFormat("es-UY", { timeZone: "America/Montevideo", hour: "2-digit", minute: "2-digit", hour12: false });

export const horaLocal = (iso: string) => hora.format(new Date(iso));
export const hoyLocal = () => diaLocal(new Date().toISOString());

/** Instante (ISO con zona) de una fecha y hora escritas en horario de Montevideo. */
export const aInstante = (fecha: string, hhmm: string) => `${fecha}T${hhmm}:00${OFFSET}`;

const esFecha = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));

export const fechaValida = (s: unknown, porDefecto: string) => (esFecha(s) ? s : porDefecto);

export function sumarDias(fecha: string, n: number) {
  const d = new Date(`${fecha}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Lunes de la semana que contiene a `fecha`. */
export function lunesDe(fecha: string) {
  const d = new Date(`${fecha}T00:00:00Z`);
  return sumarDias(fecha, -((d.getUTCDay() + 6) % 7));
}

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const DIAS_CORTOS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

const partes = (fecha: string) => {
  const d = new Date(`${fecha}T00:00:00Z`);
  return { dow: d.getUTCDay(), dia: d.getUTCDate(), mes: d.getUTCMonth() };
};

export const nombreDia = (f: string) => DIAS[partes(f).dow];
export const nombreDiaCorto = (f: string) => DIAS_CORTOS[partes(f).dow];
export const numeroDia = (f: string) => partes(f).dia;
export const nombreMes = (f: string) => MESES[partes(f).mes];
export const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

/** "Sábado 26 de septiembre" */
export const fechaLarga = (f: string) => `${cap(nombreDia(f))} ${numeroDia(f)} de ${nombreMes(f)}`;

/** "21 – 27 sep" */
export function rangoSemana(lunes: string) {
  const dom = sumarDias(lunes, 6);
  const m = (f: string) => nombreMes(f).slice(0, 3);
  return partes(lunes).mes === partes(dom).mes
    ? `${numeroDia(lunes)} – ${numeroDia(dom)} ${m(dom)}`
    : `${numeroDia(lunes)} ${m(lunes)} – ${numeroDia(dom)} ${m(dom)}`;
}

/** Datos ya preparados para mostrar y editar un turno; viajan al navegador. */
export type TurnoVista = {
  id: number;
  dia: string; // 2026-09-26
  hora: string; // 14:30
  fechaHora: string; // "sáb, 26 sept · 14:30"
  estado: "agendado" | "realizado" | "cancelado";
  medioPago: string | null;
  notas: string | null;
  total: number;
  vehiculo: { id: number; matricula: string | null; modelo: string; tamano: string };
  cliente: { id: number; nombre: string; telefono: string | null };
  items: ItemVista[];
};

export type ItemVista = {
  tipo: "servicio" | "combo";
  refId: number; // id de la categoría o del combo
  nombre: string;
  colores: string[];
  incluye: string[]; // nombres de las categorías (solo combos)
  precio: number;
  referencia: number | null;
  nota: string | null;
};

export const coloresDelTurno = (t: TurnoVista) => [...new Set(t.items.flatMap((i) => i.colores))];
