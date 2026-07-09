import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bundle the local frame PNGs into the mockup route's serverless function so they
  // resolve in production. iPhone frames are normally served from the remote R2 bucket,
  // but the Mac frames only exist locally, so the generate route falls back to disk.
  outputFileTracingIncludes: {
    "/api/generate": ["./frames/**/*"],
  },
};

export default nextConfig;

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
