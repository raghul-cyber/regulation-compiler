import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "pk_test_bm9ybWFsLXNocmV3LTExLmNsZXJrLmFjY291bnRzLmRldiQ",
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "https://regulation-compiler.onrender.com/api/v1",
  },
};

export default nextConfig;
