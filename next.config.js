/** @type {import('next').NextConfig} */
// Detect build type
// By default, assume App Hosting (supports API routes)
// Only use static export if explicitly requested via SKIP_STATIC_EXPORT=false
const isStaticExport =
  process.env.SKIP_STATIC_EXPORT === "false" ||
  process.env.NEXT_EXPORT === "true" ||
  process.env.OUTPUT_EXPORT === "true";

// Detect if running on Firebase App Hosting
const isAppHosting =
  process.env.FIREBASE_APP_HOSTING === "true" ||
  process.env.NEXT_PUBLIC_FIREBASE_APP_HOSTING === "true" ||
  process.env.FIREBASE_APP_HOSTING === "1" ||
  process.env.NEXT_PUBLIC_FIREBASE_APP_HOSTING === "1" ||
  // Default: assume App Hosting if not explicitly static export
  !isStaticExport;

const path = require("path");

const nextConfig = {
  reactStrictMode: true,
  // Only use static export if explicitly requested
  // App Hosting supports full Next.js with API routes
  ...(isStaticExport ? { output: "export" } : {}),
  distDir: isStaticExport ? "out" : ".next",
  images: {
    // Enable optimization for App Hosting, disable for static export
    unoptimized: isStaticExport,
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
