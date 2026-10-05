import type { NextConfig } from "next";

const onVercel = Boolean(process.env.VERCEL);

const nextConfig: NextConfig = {
  // Docker / Kubernetes run the standalone server; Vercel builds its own functions.
  output: onVercel ? undefined : "standalone",
  typescript: { ignoreBuildErrors: true },
  // PGlite (local development database) loads its WebAssembly files from node_modules
  serverExternalPackages: ["@electric-sql/pglite"],
  // SQL migrations are read from disk at runtime; make sure every server function ships them.
  outputFileTracingIncludes: {
    "/**": ["./drizzle/**/*"],
  },
};

export default nextConfig;
