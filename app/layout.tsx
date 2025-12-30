import type { Metadata, Viewport } from "next";
import "./globals.css";
import Script from "next/script";
import { ServiceWorkerRegistration } from "@/src/presentation/components/ServiceWorkerRegistration";
import { ClientProviders } from "@/src/presentation/components/layout/ClientProviders";

export const metadata: Metadata = {
  title: "Connect - Sistema de Campañas",
  description: "Sistema de gestión de campañas políticas",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Connect",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#000000",
};

// Site key de reCAPTCHA v3
const RECAPTCHA_SITE_KEY = "6LdtfCIsAAAAAGKD9vHbGG-HBRmYTbEp17_S9xhC";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Meta tags PWA */}
        <meta name="application-name" content="Connect" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Connect" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-config" content="/browserconfig.xml" />

        {/* Favicon links */}
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />

        {/* Cargar reCAPTCHA v3 */}
        <Script
          src={`https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`}
          strategy="beforeInteractive"
        />
        {/* Google Maps ahora se carga dinámicamente usando @googlemaps/js-api-loader */}
      </head>
      <body className="antialiased">
        <ClientProviders>
          {children}
          <ServiceWorkerRegistration />
        </ClientProviders>
      </body>
    </html>
  );
}
