"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { inputCls } from "@/components/form";

/** Campo de búsqueda que actualiza ?q= en la URL; el filtro lo hace el servidor. */
export function Buscador() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [valor, setValor] = useState(params.get("q") ?? "");
  const primera = useRef(true);

  useEffect(() => {
    if (primera.current) {
      primera.current = false;
      return;
    }
    const t = setTimeout(() => {
      const q = valor.trim();
      router.replace(q ? `${pathname}?q=${encodeURIComponent(q)}` : pathname, { scroll: false });
    }, 250);
    return () => clearTimeout(t);
  }, [valor, pathname, router]);

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="q" className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">
        Buscar por nombre o matrícula
      </label>
      <input
        id="q"
        type="search"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        placeholder="Ej: SAB 1234"
        autoComplete="off"
        className={`${inputCls} lg:max-w-md`}
      />
    </div>
  );
}
