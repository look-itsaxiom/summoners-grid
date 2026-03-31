import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Keep the existing src/ directory structure
  // Next.js app router lives in app/
  experimental: {
    // Allow importing from src/engine, src/types, src/data
  },
};

export default nextConfig;
