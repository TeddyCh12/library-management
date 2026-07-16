import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "covers.openlibrary.org",
        pathname: "/b/isbn/**",
      },
    ],
    // Dev only: ISP DNS64/NAT64 resolves external hosts into 64:ff9b::/96,
    // tripping the SSRF guard's private-IP check locally. Production
    // resolves normally and keeps the full guard + optimizer.
    ...(process.env.NODE_ENV === "development"
      ? { dangerouslyAllowLocalIP: true }
      : {}),
  },
};

export default nextConfig;
