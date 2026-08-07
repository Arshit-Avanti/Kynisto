import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbo: {
    rules: {
      "*.sql": {
        loaders: ["raw-loader"],
        as: "*.js",
      },
    },
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.sql$/,
      use: "raw-loader",
    });
    return config;
  },
};

export default nextConfig;
