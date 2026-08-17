/** @type {import('next').NextConfig} */
const isGHPages = process.env.GITHUB_PAGES === "true";

const nextConfig = {
  ...(isGHPages ? { output: "export" } : {}),
  images: { unoptimized: true },
  basePath: isGHPages ? "/lis-tracker" : "",
  assetPrefix: isGHPages ? "/lis-tracker" : "",
};

export default nextConfig;
