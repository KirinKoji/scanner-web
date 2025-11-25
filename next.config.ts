import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: false,

  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: process.env.NODE_ENV === "development" 
              ? "https://localhost:3001,https://127.0.0.1:3001,https://local-origin.dev,https://*.local-origin.dev" 
              : "*"
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
          {
            key: "Access-Control-Allow-Credentials",
            value: "true",
          },
        ],
      },
    ];
  },

  // Configure allowed development origins
  ...(process.env.NODE_ENV === "development" && {
    allowedDevOrigins: [
      'localhost:3001',
      '127.0.0.1:3001',
      'local-origin.dev',
      '*.local-origin.dev'
    ]
  }),
};

export default nextConfig;
