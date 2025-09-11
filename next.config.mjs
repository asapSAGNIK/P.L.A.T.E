/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  // Remove experimental options that may cause issues
  experimental: {
    // Removed workerThreads and cpus settings that can cause permission issues
  },
  // Remove outdated onDemandEntries for Next.js 15
}

export default nextConfig
