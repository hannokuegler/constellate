import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        // static graph data: cache briefly, the pipeline can republish at any time
        source: "/data/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=300, stale-while-revalidate=3600" }],
      },
    ];
  },
};

export default nextConfig;
