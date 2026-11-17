import type { CapacitorConfig } from "@capacitor/cli";

// Loads the production webapp inside the native WebView instead of bundling
// a static export, so the native shell is always in sync with the latest
// Vercel deploy — no separate build needed for ordinary webapp changes.
// Change server.url to a staging deploy while testing.
const config: CapacitorConfig = {
  appId: "it.visitaup.app",
  appName: "VisitaUp",
  webDir: "www",
  server: {
    url: "https://visitaup.vercel.app",
    cleartext: false,
  },
};

export default config;
