import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "afmlpcydtsbwnlumtxav.supabase.co",
      },
    ],
  },
};

export default nextConfig;
