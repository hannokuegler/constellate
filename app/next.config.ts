import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // always inlined (empty by default), so without the dev switch the fixture import is dead code and never bundled
  env: { NEXT_PUBLIC_USE_FIXTURES: process.env.NEXT_PUBLIC_USE_FIXTURES === "1" ? "1" : "" },
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
