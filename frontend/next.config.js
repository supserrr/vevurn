/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep image optimization disabled for Render
  images: {
    unoptimized: true,
  },

  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
}

module.exports = nextConfig
