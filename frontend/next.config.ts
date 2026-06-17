import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 is a native Node.js addon — must not be bundled by webpack
  serverExternalPackages: ['better-sqlite3'],
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
