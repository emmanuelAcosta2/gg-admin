import type { Metadata } from "next";
import { PageHeader, Placeholder } from "@/components/page-header";

export const metadata: Metadata = { title: "Reportes" };

export default function Page() {
  return (
    <>
      <PageHeader title="Reportes" />
      <Placeholder paso="Paso 7">Facturación por período, servicios por categoría y ticket promedio.</Placeholder>
    </>
  );
}
