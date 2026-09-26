import type { Metadata } from "next";
import { PageHeader, Placeholder } from "@/components/page-header";

export const metadata: Metadata = { title: "Agenda" };

export default function Page() {
  return (
    <>
      <PageHeader title="Agenda" />
      <Placeholder paso="Paso 5 · Turnos">Calendario diario y semanal, con los turnos coloreados por categoría.</Placeholder>
    </>
  );
}
