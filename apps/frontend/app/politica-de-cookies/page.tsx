import PoliticaCookiesPage from "@/components/pages/politica-cookies/PoliticaCookiesPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Cookies - Club Triple Impacto",
  description: "Conocé cómo utilizamos las cookies en Club Triple Impacto para ofrecerte una mejor experiencia, analizar el rendimiento y personalizar tus beneficios.",
};

export default function PoliticaCookies() {
  return <PoliticaCookiesPage />;
}
