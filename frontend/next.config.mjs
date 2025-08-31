/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only ignore build errors in production
  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV === 'production',
  },
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'production',
  },
  images: {
    unoptimized: true,
  },
  // Development optimizations
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
  // Better development experience
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
}

export default nextConfig
