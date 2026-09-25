import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Escribinos para consultas sobre donaciones, beneficios o para sumar tu ONG o marca a Club Triple Impacto.",
  alternates: { canonical: "/contact" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
