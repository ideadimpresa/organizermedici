import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // PDF uploads (piani alimentari, referti BIA) go through Server Actions;
      // Vercel serverless functions cap request bodies around 4.5mb regardless.
      bodySizeLimit: "4mb",
    },
  },
  // mupdf loads its WASM binary at runtime via new URL(..., import.meta.url)
  // + fs.readFileSync. Left to the bundler, Turbopack treats that .wasm as a
  // static asset and rewrites it to a hashed /_next/static/... path, which
  // doesn't exist on the server's filesystem at runtime (confirmed in
  // production: "ENOENT ... /_next/static/immutable/media/mupdf-wasm.*.wasm").
  // Marking the package external skips bundling it — plain Node `require`
  // from node_modules instead — so the real file path resolves correctly.
  serverExternalPackages: ["mupdf"],
  // Vercel's file tracer needs an explicit nudge to include the (now
  // unbundled) WASM binary in the deployed function.
  outputFileTracingIncludes: {
    "/*": ["./node_modules/mupdf/dist/**/*"],
  },
};

export default nextConfig;
