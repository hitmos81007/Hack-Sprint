import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";
import { resolve } from "node:path";
import { securityHeaders } from "./lib/security";
loadEnvConfig(resolve(process.cwd(), ".."));
const nextConfig: NextConfig = {
  poweredByHeader:false,
  async headers(){return [{source:"/:path*",headers:Object.entries(securityHeaders).map(([key,value])=>({key,value}))}];},
};
export default nextConfig;
