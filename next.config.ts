import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/',
        destination: '/trade',
        permanent: false, // Set to true for 301 permanent redirect
      },
    ];
  },
};

export default nextConfig;
