import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/sections/Navbar/navbar";
import dynamic from "next/dynamic";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";

const Footer = dynamic(() => import("@/components/sections/Footer/footer"));
const WhatsAppButton = dynamic(() => import("@/components/shared/WhatsAppButton"));
const FloatingDonateButton = dynamic(() => import("@/components/shared/FloatingDonateButton"));

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AYNI - Dona y recibe descuentos exclusivos",
  description:
    "Tu donación apoya proyectos sociales y te da acceso a cupones de Bonda. Impacto real, beneficios reales.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <Navbar />
          {children}
          <Footer />
          <WhatsAppButton />
          <FloatingDonateButton />
        </AuthProvider>
      </body>
    </html>
  );
}
