import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ccimg1.canadacomputers.com',
      },
    ],
  },
};

export default nextConfig;
