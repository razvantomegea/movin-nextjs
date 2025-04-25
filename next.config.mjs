import withPWA from 'next-pwa';

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

// Only use PWA in production, not for static exports with Capacitor
const config = process.env.CAPACITOR === 'true' 
  ? nextConfig 
  : withPWA({
      dest: 'public',
      register: true,
      skipWaiting: true,
      disable: process.env.NODE_ENV === 'development',
    })(nextConfig);

export default config;
