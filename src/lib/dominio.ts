export const TAMANOS = {
  chico: "Chico",
  mediano: "Mediano",
  grande: "Grande",
  camioneta: "Camioneta",
} as const;
export type Tamano = keyof typeof TAMANOS;

export const MEDIOS_PAGO = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  debito: "Débito",
  credito: "Crédito",
} as const;

export const ESTADOS = { agendado: "Agendado", realizado: "Realizado", cancelado: "Cancelado" } as const;
export type Estado = keyof typeof ESTADOS;

const TZ = "America/Montevideo";

const fechaCorta = new Intl.DateTimeFormat("es-UY", { timeZone: TZ, weekday: "short", day: "numeric", month: "short" });
const hora = new Intl.DateTimeFormat("es-UY", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false });
const fechaDia = new Intl.DateTimeFormat("en-CA", { timeZone: TZ });

/** "vie, 26 sept · 14:30", siempre en horario de Montevideo. */
export function formatFechaHora(iso: string) {
  const d = new Date(iso);
  return `${fechaCorta.format(d)} · ${hora.format(d)}`;
}

/** "2026-09-26" en horario de Montevideo. */
export const diaLocal = (iso: string) => fechaDia.format(new Date(iso));

/** Deja la matrícula en mayúsculas y con un solo espacio: "sab   1234" -> "SAB 1234".
 *  Solo para strings de formulario ya leídos (texto(fd, ...), useState); nunca para un valor
 *  leído de la base, que puede ser null (usar matriculaSinEspacios para eso). */
export const normalizarMatricula = (m: string) => m.trim().replace(/\s+/g, " ").toUpperCase();

/** Para comparar matrículas en buscadores: sin espacios, en mayúsculas. Tolera null/undefined
 *  porque la matrícula de un vehículo es opcional. */
export const matriculaSinEspacios = (m: string | null | undefined) => (m ?? "").replace(/\s+/g, "").toUpperCase();

export const iniciales = (nombre: string) =>
  nombre
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
