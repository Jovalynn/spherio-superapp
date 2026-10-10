import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfkit"],
  experimental: { useTypeScriptCli: false },
  /* config options here */
};

export default nextConfig;
