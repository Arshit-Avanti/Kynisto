import type { NextConfig } from "next";

const nextConfig = {
  turbo: {
    rules: {
      "*.sql": {
        loaders: ["raw-loader"],
        as: "*.js",
      },
    },
  },
  webpack: (config: any) => {
    config.module.rules.push({
      test: /\.sql$/,
      use: "raw-loader",
    });
    return config;
  },
} as unknown as NextConfig;

export default nextConfig;
