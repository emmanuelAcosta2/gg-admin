"use client";

import { useState } from "react";
import { btnSmCls } from "@/components/form";

export function Copiar({ texto }: { texto: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      // Sin permiso para el portapapeles: el número sigue a la vista para seleccionarlo.
    }
  }

  return (
    <button type="button" onClick={copiar} className={btnSmCls}>
      {copiado ? "Copiado" : "Copiar"}
    </button>
  );
}
