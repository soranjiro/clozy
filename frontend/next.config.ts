import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["placehold.jp", "via.placeholder.com", "c.imgz.jp"],
  },
  async headers() {
    // 開発環境とプロダクション環境で異なるCSP設定を使用
    const isDevelopment = process.env.NODE_ENV === "development";

    // 開発環境ではより緩いCSP設定を使用
    const cspValue = isDevelopment
      ? `
          default-src 'self';
          script-src 'self' 'unsafe-inline' 'unsafe-eval';
          style-src 'self' 'unsafe-inline' http: https:;
          img-src 'self' data: blob: http: https:;
          font-src 'self' data:;
          connect-src 'self' ${
            process.env.NEXT_PUBLIC_API_DOMAIN || "*"
          } ws: wss:;
          frame-src 'self';
          object-src 'none';
          base-uri 'self';
          form-action 'self';
        `
          .replace(/\s+/g, " ")
          .trim()
      : `
          default-src 'self';
          script-src 'self' 'unsafe-inline' 'unsafe-eval';
          style-src 'self' 'unsafe-inline';
          img-src 'self' data: blob: https: http:;
          font-src 'self';
          connect-src 'self' ${process.env.NEXT_PUBLIC_API_DOMAIN || "*"};
          frame-src 'self';
          object-src 'none';
          base-uri 'self';
          form-action 'self';
          frame-ancestors 'self';
          block-all-mixed-content;
          upgrade-insecure-requests;
        `
          .replace(/\s+/g, " ")
          .trim();

    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspValue,
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
  // 開発時にはHTTPSを使用しない設定
  devIndicators: {
    buildActivity: true,
  },
};

export default nextConfig;
