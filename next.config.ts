import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dev-only "N" badge sat over the sidebar's profile row; keep it out of the way.
  devIndicators: { position: "bottom-right" },
};

export default nextConfig;
