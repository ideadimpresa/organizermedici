import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // PDF uploads (piani alimentari, referti BIA) go through Server Actions;
      // Vercel serverless functions cap request bodies around 4.5mb regardless.
      bodySizeLimit: "4mb",
    },
  },
  // mupdf's WASM binary is loaded via new URL(..., import.meta.url) at
  // runtime, which Vercel's file tracer doesn't always pick up reliably —
  // force it into every route's server bundle so PDF-to-image rendering
  // doesn't fail only in production.
  outputFileTracingIncludes: {
    "/*": ["./node_modules/mupdf/dist/**/*"],
  },
};

export default nextConfig;
