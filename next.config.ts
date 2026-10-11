import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfkit", "exceljs"],
  turbopack: { root: process.cwd() },
  /* config options here */
};

export default nextConfig;
