import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.githubusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "gitlab.com" },
      { protocol: "https", hostname: "**.gitlab.io" },
      { protocol: "https", hostname: "codeberg.org" },
    ],
  },
};

export default nextConfig;
