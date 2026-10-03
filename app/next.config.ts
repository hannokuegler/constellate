import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// optional external data origin (NEXT_PUBLIC_DATA_BASE, dev/test hook in lib/data.ts) must be reachable from the browser
function dataOrigin(): string {
  try {
    const base = process.env.NEXT_PUBLIC_DATA_BASE;
    return base && /^https?:\/\//.test(base) ? ` ${new URL(base).origin}` : "";
  } catch {
    return "";
  }
}

// Next.js injects inline bootstrap scripts (and layout.tsx sets the theme inline), so script-src needs 'unsafe-inline'
// without a nonce middleware; dev additionally needs eval and the HMR websocket. The graph is a 2d canvas: no workers, no WebGL.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self'${dataOrigin()}${isDev ? " ws: wss:" : ""}`,
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // always inlined (empty by default), so without the dev switch the fixture import is dead code and never bundled
  env: { NEXT_PUBLIC_USE_FIXTURES: process.env.NEXT_PUBLIC_USE_FIXTURES === "1" ? "1" : "" },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // static graph data: cache briefly, the pipeline can republish at any time
        source: "/data/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=300, stale-while-revalidate=3600" }],
      },
    ];
  },
};

export default nextConfig;
