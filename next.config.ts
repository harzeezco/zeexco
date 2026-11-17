import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      "/register/:path*",
      "/whatsapp/register/:path*",
      "/verify-email/:path*",
    ].map((source) => ({
      source,
      headers: [{ key: "Referrer-Policy", value: "no-referrer" }],
    }));
  },
};

export default nextConfig;
