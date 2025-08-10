/** @type {import('next').NextConfig} */
const nextConfig = {
  // App Router is enabled by default in Next.js 13+
  output: 'standalone',
  
  // Optimize for production
  experimental: {
    // Disable CSS optimization for now to fix build issues
    // optimizeCss: true,
    // Enable React 19 concurrent features
    ppr: false, // Partial Prerendering (experimental)
  },

  // Performance optimizations
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },
}

module.exports = nextConfig
