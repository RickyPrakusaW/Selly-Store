import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['localhost', '127.0.0.1', '192.168.0.106', '*.local'],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
