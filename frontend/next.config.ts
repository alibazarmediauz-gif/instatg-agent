import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ['recharts', 'd3-path', 'd3-shape'],
  output: "standalone",
  async redirects() {
    return [
      {
        source: "/",
        destination: "/dashboard",
        permanent: false, // Use temporary redirect so we can turn the landing page back on later
      },
    ];
  },
};

export default nextConfig;
