import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: { ignoreBuildErrors: true },
  // PGlite (local development database) loads its WebAssembly files from node_modules
  serverExternalPackages: ["@electric-sql/pglite"],
};

export default nextConfig;
