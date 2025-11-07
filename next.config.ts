import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  
  // Add this redirects function
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: true, // Use true for production
      },
    ]
  },
};

export default nextConfig;