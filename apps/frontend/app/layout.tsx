import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/sections/Navbar/navbar";
import dynamic from "next/dynamic";
import { AuthProvider } from "@/contexts/AuthContext";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from "next/script";
import "./globals.css";

const Footer = dynamic(() => import("@/components/sections/Footer/footer"));
const WhatsAppButton = dynamic(() => import("@/components/shared/WhatsAppButton"));
const FloatingDonateButton = dynamic(() => import("@/components/shared/FloatingDonateButton"));
const CookieConsent = dynamic(() => import("@/components/shared/CookieConsent"));

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AYNI - Doná y recibí descuentos exclusivos",
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
      <head>
        <link rel="dns-prefetch" href="https://backend-production-83f0.up.railway.app" />
        <link rel="dns-prefetch" href="https://faibhrhrassmrokvzqeu.supabase.co" />
        
        {/* Google Analytics */}
        <Script
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=G-M5TG1BR274`}
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-M5TG1BR274', {
                page_path: window.location.pathname,
              });
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
          <Footer />
          <WhatsAppButton />
          <FloatingDonateButton />
          <CookieConsent />
        </AuthProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
