import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@gndwrk/types"],
  experimental: {
    // Enable React 19 features
    reactCompiler: false,
  },
};

export default nextConfig;
