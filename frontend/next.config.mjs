/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Disable static generation to avoid SSR issues
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
  // Force all pages to be dynamic
  staticPageGenerationTimeout: 0,
}

export default nextConfig
