/** @type {import('next').NextConfig} */
// Detect if running on Firebase App Hosting
const isAppHosting =
  process.env.FIREBASE_APP_HOSTING === "true" ||
  process.env.NEXT_PUBLIC_FIREBASE_APP_HOSTING === "true";

const nextConfig = {
  reactStrictMode: true,
  // Only use static export for traditional Firebase Hosting
  // App Hosting supports full Next.js with API routes
  ...(isAppHosting ? {} : { output: "export" }),
  distDir: isAppHosting ? ".next" : "out",
  images: {
    // Enable optimization for App Hosting, disable for static export
    unoptimized: !isAppHosting,
  },
  trailingSlash: true,
  // Deshabilitar verificación estricta de generateStaticParams para rutas dinámicas
  // Las rutas dinámicas se manejarán completamente en el cliente
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
};

module.exports = nextConfig;
