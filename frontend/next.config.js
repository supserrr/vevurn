/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel-optimized configuration
  images: {
    unoptimized: false, // Vercel handles image optimization well
    domains: ['vevurn.onrender.com'], // Allow images from backend
  },

  // Environment variables validation
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
  },

  // Performance optimizations for Vercel
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Redirect configuration
  async redirects() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://vevurn.onrender.com/api/:path*',
        permanent: false,
      },
    ]
  },

  // Headers for better security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
