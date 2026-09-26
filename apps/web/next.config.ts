import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on"
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload"
  },
  {
    key: "X-Frame-Options",
    value: "DENY"
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff"
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin"
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()"
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin"
  },
  {
    key: "Cross-Origin-Resource-Policy",
    value: "same-origin"
  },
  {
    key: "Cross-Origin-Embedder-Policy",
    value: "credentialless"
  },
  {
    key: "Content-Security-Policy",
    value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://*.clerk.accounts.dev https://clerk.regcompiler.app https://va.vercel-scripts.com https://challenges.cloudflare.com; worker-src 'self' blob:; child-src 'self' blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https:; font-src 'self' data: https: https://fonts.gstatic.com; media-src 'self' blob: https:; connect-src 'self' https: wss: http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:*; frame-src 'self' https://*.clerk.accounts.dev https://clerk.regcompiler.app https://js.stripe.com https://challenges.cloudflare.com; frame-ancestors 'none'; object-src 'none'; base-uri 'self';"
  }
];

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  env: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "pk_test_bm9ybWFsLXNocmV3LTExLmNsZXJrLmFjY291bnRzLmRldiQ",
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "https://regulation-compiler.onrender.com/api/v1",
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: "/sign-in",
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: "/sign-up",
    NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL: "/dashboard",
    NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL: "/dashboard",
    NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: "/dashboard",
    NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: "/dashboard",
  },
  async rewrites() {
    const rawBackend = process.env.INTERNAL_API_URL || process.env.API_URL || "https://regulation-compiler.onrender.com/api/v1";
    const backendBase = rawBackend.replace(/\/+$/, "");
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendBase}/:path*`,
      },
      {
        source: "/backend-api/:path*",
        destination: `${backendBase}/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/((?!sitemap\\.xml|robots\\.txt|\\.well-known).*)",
        headers: securityHeaders,
      },
      {
        source: "/sitemap.xml",
        headers: [
          { key: "Content-Type", value: "application/xml; charset=utf-8" },
          { key: "Cache-Control", value: "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400" },
          { key: "Access-Control-Allow-Origin", value: "*" },
        ],
      },
      {
        source: "/robots.txt",
        headers: [
          { key: "Content-Type", value: "text/plain; charset=utf-8" },
          { key: "Cache-Control", value: "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400" },
          { key: "Access-Control-Allow-Origin", value: "*" },
        ],
      },
    ];
  },
};

export default nextConfig;
