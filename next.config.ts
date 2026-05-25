import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 16 uses Turbopack by default.
  // `root` tells Turbopack this project is self-contained, silencing the
  // "multiple lockfiles" warning caused by ~/package.json existing at home dir.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
