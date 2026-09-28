"use client";

import { createContext, useContext, type ReactNode } from "react";

export type Catalogo = {
  categorias: { id: number; nombre: string; color: string; precio: number | null }[];
  combos: { id: number; nombre: string; precio: number; colores: string[] }[];
  vehiculos: { id: number; matricula: string | null; modelo: string; tamano: string; cliente: string; clienteId: number }[];
  clientes: { id: number; nombre: string }[];
  hoy: string;
};

const Ctx = createContext<Catalogo | null>(null);

/** Lo que hace falta para armar un turno: se manda una sola vez y lo usan todos los formularios de la página. */
export function CatalogoProvider({ catalogo, children }: { catalogo: Catalogo; children: ReactNode }) {
  return <Ctx.Provider value={catalogo}>{children}</Ctx.Provider>;
}

export function useCatalogo() {
  const c = useContext(Ctx);
  if (!c) throw new Error("Falta CatalogoProvider");
  return c;
}
