/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ["image/webp"],
    minimumCacheTTL: 2678400,
    qualities: [60, 75],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 24, 32, 48, 64, 96, 128, 256, 384],
    localPatterns: [
      {
        pathname: "/images/**",
        search: "",
      },
      {
        pathname: "/placeholder.svg",
        search: "",
      },
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.public.blob.vercel-storage.com",
        port: "",
        pathname: "/**",
      },
    ],
  },

  experimental: {
    serverActions: {
      bodySizeLimit: "8mb", // Increase the limit to 8MB
    },
  },
};

export default nextConfig;
