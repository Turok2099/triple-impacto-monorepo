import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quiénes somos",
  description:
    "Club Triple Impacto conecta donaciones a ONGs con descuentos y cupones exclusivos de marcas aliadas. Conocé nuestra misión y equipo.",
  alternates: { canonical: "/about" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
