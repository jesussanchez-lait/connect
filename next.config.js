/** @type {import('next').NextConfig} */
// Detect if running on Firebase App Hosting
// Check multiple environment variables to ensure detection works
const isAppHosting =
  process.env.FIREBASE_APP_HOSTING === "true" ||
  process.env.NEXT_PUBLIC_FIREBASE_APP_HOSTING === "true" ||
  process.env.FIREBASE_APP_HOSTING === "1" ||
  process.env.NEXT_PUBLIC_FIREBASE_APP_HOSTING === "1";

const path = require("path");

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
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Resolver alias @/ para que apunte a la raíz del proyecto
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(__dirname),
    };
    return config;
  },
};

module.exports = nextConfig;
