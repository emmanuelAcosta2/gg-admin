import type { Metadata } from "next";
import { PageHeader, Placeholder } from "@/components/page-header";

export const metadata: Metadata = { title: "Registro" };

export default function Page() {
  return (
    <>
      <PageHeader title="Registro" />
      <Placeholder paso="Paso 6">Listado de trabajos realizados, filtrable por período y por categoría o combo.</Placeholder>
    </>
  );
}
