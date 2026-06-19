import PoliticaCookiesPage from "@/components/pages/politica-cookies/PoliticaCookiesPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Cookies - AYNI",
  description: "Conocé cómo utilizamos las cookies en AYNI para ofrecerte una mejor experiencia, analizar el rendimiento y personalizar tus beneficios.",
};

export default function PoliticaCookies() {
  return <PoliticaCookiesPage />;
}
