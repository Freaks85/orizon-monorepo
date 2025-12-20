import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@orizon/ui", "@orizon/database"],
};

export default nextConfig;
