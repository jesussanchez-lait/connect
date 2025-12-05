import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Connect - Clean Architecture Next.js App",
  description: "A Next.js application built with clean architecture",
};

// Site key de reCAPTCHA v3
const RECAPTCHA_SITE_KEY = "6LdtfCIsAAAAAGKD9vHbGG-HBRmYTbEp17_S9xhC";
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Cargar reCAPTCHA v3 */}
        <Script
          src={`https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`}
          strategy="beforeInteractive"
        />
        {/* Cargar Google Maps Places API para autocomplete */}
        {GOOGLE_MAPS_API_KEY && (
          <Script
            src={`https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`}
            strategy="lazyOnload"
          />
        )}
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
