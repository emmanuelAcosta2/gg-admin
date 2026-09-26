import Image from "next/image";

export function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex">
        <Image
          src="/logo-gg.png"
          alt="GG Lavadero y Detailing"
          width={46}
          height={46}
          className="size-10 rounded-full border-2 border-surface object-cover lg:size-[46px]"
        />
        <Image
          src="/logo-germino.png"
          alt="Germino Alineaciones"
          width={46}
          height={46}
          className="-ml-2.5 size-10 rounded-full border-2 border-surface object-cover lg:size-[46px]"
        />
      </div>
      <div className="font-display text-2xl leading-none font-bold tracking-wide uppercase italic lg:text-[28px]">
        GyG Taller
        <small className="mt-1 block font-sans text-[11px] leading-tight font-semibold tracking-[0.1em] whitespace-nowrap text-muted not-italic">
          Turnos y facturación
        </small>
      </div>
    </div>
  );
}
