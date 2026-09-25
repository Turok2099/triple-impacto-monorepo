import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ONGs aliadas",
  description:
    "Conocé las organizaciones sociales que forman parte de Club Triple Impacto y elegí a cuál donar para acceder a beneficios exclusivos.",
  alternates: { canonical: "/ongs" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
