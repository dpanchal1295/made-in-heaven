import type { NextConfig } from 'next';

const isProd = process.env.NODE_ENV === 'production';

// CSP Directives:
// Allows Google Fonts (fonts.googleapis.com, fonts.gstatic.com)
// Allows Firebase Auth and Firestore endpoints, Google Accounts auth iframe & popups
// Allows 'unsafe-inline' and 'unsafe-eval' required by Next.js client hydration and Framer Motion
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://accounts.google.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com data:;
  img-src 'self' data: blob: https:;
  media-src 'self' data: blob:;
  connect-src 'self' https://apis.google.com https://accounts.google.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://*.firebaseio.com https://*.googleapis.com wss://*.firebaseio.com;
  frame-src 'self' https://apis.google.com https://accounts.google.com https://*.firebaseapp.com;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
`
  .replace(/\s{2,}/g, ' ')
  .trim();

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    qualities: [75, 80, 85],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
          {
            key: 'Content-Security-Policy',
            value: cspHeader,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
