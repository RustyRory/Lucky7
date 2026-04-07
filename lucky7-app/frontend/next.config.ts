import type { NextConfig } from "next";

const basePath = process.env.NEXT_BASE_PATH || '';

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: 'standalone',
  basePath,
  trailingSlash: true,
};

export default nextConfig;
