import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/sections/Navbar/navbar";
import dynamic from "next/dynamic";
import { AuthProvider } from "@/contexts/AuthContext";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { GoogleTagManager } from "@next/third-parties/google";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";
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
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Club Triple Impacto - Doná y recibí descuentos exclusivos",
    template: "%s | Club Triple Impacto",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "Club Triple Impacto - Doná y recibí descuentos exclusivos",
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Club Triple Impacto - Doná y recibí descuentos exclusivos",
    description: SITE_DESCRIPTION,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/icon.svg`,
      sameAs: [
        "https://www.linkedin.com/company/comunidad-club-triple-impacto/",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      inLanguage: "es-AR",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-AR">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <link rel="dns-prefetch" href="https://backend-production-83f0.up.railway.app" />
        <link rel="dns-prefetch" href="https://faibhrhrassmrokvzqeu.supabase.co" />
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
        <GoogleTagManager gtmId="GTM-P4XBH88X" />
      </body>
    </html>
  );
}
