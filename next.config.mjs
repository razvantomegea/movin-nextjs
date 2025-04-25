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
  // Use trailing slashes for compatibility
  trailingSlash: true,
  // Ensure assets are properly referenced
  assetPrefix: './',
  // Disable basePath for Capacitor compatibility
  basePath: '',
};

export default nextConfig;
