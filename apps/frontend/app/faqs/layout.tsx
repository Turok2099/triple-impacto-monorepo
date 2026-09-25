import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Preguntas frecuentes",
  description:
    "Resolvé tus dudas sobre cómo donar, cómo funcionan los cupones de Bonda y cómo ser parte de Club Triple Impacto.",
  alternates: { canonical: "/faqs" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
