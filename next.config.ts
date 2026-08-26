import type { NextConfig } from "next";

const chromiumBin = "node_modules/@sparticuz/chromium/bin/**";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
  outputFileTracingIncludes: {
    "/api/profile": [chromiumBin],
    "/api/profile/route": [chromiumBin],
  },
};

export default nextConfig;
