import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
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
