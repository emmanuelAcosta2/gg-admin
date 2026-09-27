import Image from "next/image";

function Logos({ big }: { big?: boolean }) {
  return (
    <div className="flex flex-none">
      <Image
        src="/logo-gg.png"
        alt="GG Lavadero y Detailing"
        width={46}
        height={46}
        className={`size-10 rounded-full border-2 border-surface object-cover ${big ? "lg:size-[46px]" : ""}`}
      />
      <Image
        src="/logo-germino.png"
        alt="Germino Alineaciones"
        width={46}
        height={46}
        className={`-ml-2.5 size-10 rounded-full border-2 border-surface object-cover ${big ? "lg:size-[46px]" : ""}`}
      />
    </div>
  );
}

const wordmark = (size: string) => (
  <div className={`font-display ${size} leading-none font-bold tracking-wide uppercase italic`}>
    GyG Taller
    <small className="mt-1 block font-sans text-[11px] leading-tight font-semibold tracking-[0.1em] whitespace-nowrap text-muted not-italic">
      Turnos y facturación
    </small>
  </div>
);

/**
 * `stacked` apila los logos arriba y el nombre abajo, a todo el ancho disponible: lo usa el
 * menú lateral, donde una fila horizontal no le deja lugar a "GyG Taller" en una sola línea.
 */
export function Brand({ stacked }: { stacked?: boolean }) {
  if (stacked) {
    return (
      <div className="flex flex-col gap-3">
        <Logos big />
        {wordmark("text-2xl")}
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3">
      <Logos />
      {wordmark("text-2xl")}
    </div>
  );
}
