import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  output: 'export',
  trailingSlash: true,
  basePath: '/STACK-OVERFLOW',
  assetPrefix: '/STACK-OVERFLOW/',
  env: {
    BACKEND_URL: process.env.BACKEND_URL,
  },
};

export default nextConfig;
