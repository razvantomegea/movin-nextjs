/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Configure static export
  output: 'export',
  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },
  // Don't use trailing slashes for better compatibility with static hosting
  trailingSlash: false,
  // Don't use assetPrefix for better path resolution
  assetPrefix: '',
  // Disable basePath for Capacitor compatibility
  basePath: '',
};

export default nextConfig;
