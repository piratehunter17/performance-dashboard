import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  
  // Configure route redirects
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: true, // permanent redirect (set true for production)
      },
    ]
  },
};

export default nextConfig;