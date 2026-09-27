"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { inputCls } from "@/components/form";

/** Selector de categoría o combo: guarda la elección en ?filtro= y vuelve a la primera página. */
export function Filtro({
  categorias,
  combos,
  valor,
}: {
  categorias: { id: number; nombre: string }[];
  combos: { id: number; nombre: string }[];
  valor: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function cambiar(nuevo: string) {
    const p = new URLSearchParams(params.toString());
    if (nuevo) p.set("filtro", nuevo);
    else p.delete("filtro");
    p.delete("limite");
    router.push(`${pathname}?${p.toString()}`, { scroll: false });
  }

  return (
    <div className="flex flex-col gap-1.5 lg:max-w-sm">
      <label htmlFor="filtro" className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">
        Categoría o combo
      </label>
      <select id="filtro" value={valor} onChange={(e) => cambiar(e.target.value)} className={inputCls}>
        <option value="">Todos los trabajos</option>
        <optgroup label="Categorías">
          {categorias.map((c) => (
            <option key={c.id} value={`cat:${c.id}`}>
              {c.nombre}
            </option>
          ))}
        </optgroup>
        {combos.length > 0 && (
          <optgroup label="Combos">
            {combos.map((c) => (
              <option key={c.id} value={`combo:${c.id}`}>
                {c.nombre}
              </option>
            ))}
          </optgroup>
        )}
      </select>
    </div>
  );
}
