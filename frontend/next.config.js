/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output for deployment
  output: 'standalone',
  
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

  // Enable experimental features for better performance
  experimental: {
    // Partial Prerendering for better performance
    ppr: false,
  },
}

module.exports = nextConfig
