import { NextRequest } from 'next/server';

const ALLOWED_ORIGINS = new Set([
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://made-in-heaven-uorx.vercel.app',
]);

const STRICT_PREVIEW_REGEX = /^https:\/\/made-in-heaven-uorx-[a-z0-9]+-dpanchal1295s-projects\.vercel\.app$/;

/**
 * Validates request Origin / Referer for state-changing HTTP methods (POST, PATCH, DELETE).
 * Returns true if valid, false if origin is untrusted or missing when required.
 */
export function checkOrigin(req: Request | NextRequest): boolean {
  const origin = req.headers.get('origin');
  if (origin) {
    if (ALLOWED_ORIGINS.has(origin)) return true;
    // Allow localhost on any port for test / local dev
    if (/^https?:\/\/localhost(:\d+)?$/.test(origin) || /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) {
      return true;
    }
    // Allow vercel preview deployments matching our specific project pattern only
    if (STRICT_PREVIEW_REGEX.test(origin)) {
      return true;
    }
    return false;
  }

  // Fallback to referer header if origin is absent (e.g. some internal same-origin fetch calls)
  const referer = req.headers.get('referer');
  if (referer) {
    try {
      const url = new URL(referer);
      const refererOrigin = url.origin;
      if (ALLOWED_ORIGINS.has(refererOrigin)) return true;
      if (/^https?:\/\/localhost(:\d+)?$/.test(refererOrigin) || /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(refererOrigin)) {
        return true;
      }
      if (STRICT_PREVIEW_REGEX.test(refererOrigin)) {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // In test runners or non-browser environments where headers might be empty, check host
  const host = req.headers.get('host');
  if (host && (host.includes('localhost') || host.includes('127.0.0.1'))) {
    return true;
  }

  return false;
}

/**
 * Helper to get the client IP for rate limiting.
 */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return '127.0.0.1';
}

