import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ["teleproto", "nodemailer"],
};

export default nextConfig;
