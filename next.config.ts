import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  // Allow mobile devices on the local network to access the dev server
  allowedDevOrigins: ['10.100.102.12'],
};

export default nextConfig;
