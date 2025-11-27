import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Connect - Clean Architecture Next.js App",
  description: "A Next.js application built with clean architecture",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
