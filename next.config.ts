import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverRuntimeConfig: {
    // Will only be available on the server side
    tempDirectory: '/tmp/uploads',
  },
  // Increase webpack buffer if needed
  webpack: (config) => {
    config.performance = {
      ...config.performance,
      maxAssetSize: 512000,
      maxEntrypointSize: 512000,
    };
    return config;
  },
};

export default nextConfig;