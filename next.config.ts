import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    resolveAlias: {
      "@shared/*": path.join(__dirname, "src/shared/*"),
      "@ar/*": path.join(__dirname, "src/modules/ar/*"),
      "@qr/*": path.join(__dirname, "src/modules/qr/*"),
      "@three/*": path.join(__dirname, "src/modules/three/*"),
    },
  },
};

export default nextConfig;
