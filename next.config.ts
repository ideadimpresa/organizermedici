import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // PDF uploads (piani alimentari, referti BIA) go through Server Actions;
      // Vercel serverless functions cap request bodies around 4.5mb regardless.
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
