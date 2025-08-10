/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure all static files are properly copied
  trailingSlash: false,
  
  // Disable image optimization on Render (causes issues)
  images: {
    unoptimized: true,
  },

  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
}

module.exports = nextConfig
