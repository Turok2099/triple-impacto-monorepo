import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://static.cloudflareinsights.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: https://res.cloudinary.com https:;
  font-src 'self' data:;
  connect-src 'self' http://localhost:* ws://localhost:* https://*.vercel.live wss://*.vercel.live https://*.up.railway.app https://*.supabase.co https://cloudflareinsights.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self' https://*.ipg-online.com https://*.fiserv.com;
  frame-ancestors 'none';
  upgrade-insecure-requests;
`;

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: cspHeader.replace(/\n/g, ''),
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  }
];

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  experimental: {
    optimizeCss: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default withAnalyzer(nextConfig);
