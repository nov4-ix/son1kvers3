/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Disable checks during build to save memory/time on CI
  typescript: {
    ignoreBuildErrors: true,
  },

  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },

  // Code splitting optimization
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  transpilePackages: ['@super-son1k/shared-ui', '@super-son1k/shared-hooks', '@super-son1k/shared-types', '@super-son1k/shared-utils'],

  // Output standalone for better deployment
  output: 'standalone',
};

module.exports = nextConfig;