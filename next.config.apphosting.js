/** @type {import('next').NextConfig} */
// Configuration for Firebase App Hosting
// This config removes static export to enable API routes and Server Components
const nextConfig = {
  reactStrictMode: true,
  // Remove output: "export" to enable API routes and server-side rendering
  // distDir: ".next", // Default Next.js output directory
  images: {
    // Enable image optimization for App Hosting
    unoptimized: false,
  },
  trailingSlash: true,
  // Enable API routes and Server Components
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
};

module.exports = nextConfig;
