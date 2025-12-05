/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "export",
  distDir: "out",
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  // Deshabilitar verificación estricta de generateStaticParams para rutas dinámicas
  // Las rutas dinámicas se manejarán completamente en el cliente
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
};

module.exports = nextConfig;
