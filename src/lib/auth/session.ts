import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { Member } from '@/types/firestore';
import { getWeddingStorage } from '@/lib/storage';

export const SESSION_COOKIE_NAME = 'mih_session';
export const SEEDED_DEMO_UIDS = [
  // Wedding demo (demo-home-1)
  'demo-aarav-1',
  'demo-diya-1',
  'demo-mother-1',
  'demo-brother-1',
  'demo-friend-1',
  // Birthday demo (demo-home-2)
  'demo-ananya-host',
  'demo-rohit-voter',
  'demo-kavita-advisor',
  // Community demo (demo-home-3)
  'demo-vikram-org',
  'demo-sunita-org',
  'demo-rajesh-voter',
  'demo-priya-advisor',
] as const;

export interface SessionData {
  uid: string;
  homeId: string;
  issuedAt: number;
  expiresAt: number;
}

export interface SessionResult {
  uid: string;
  homeId: string;
  member: Member;
}

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.trim() === '') {
    throw new Error(
      'SESSION_SECRET environment variable is missing or empty. Please set a secure SESSION_SECRET in your environment.'
    );
  }
  return secret.trim();
}

/**
 * Signs a payload with HMAC-SHA256: base64(payload).signature
 */
export function signSessionPayload(payload: SessionData): string {
  const secret = getSessionSecret();
  const jsonStr = JSON.stringify(payload);
  const dataB64 = Buffer.from(jsonStr, 'utf-8').toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(dataB64).digest('base64url');
  return `${dataB64}.${signature}`;
}

/**
 * Verifies and decodes an HMAC-SHA256 signed session string
 */
export function verifySessionPayload(token: string): SessionData | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [dataB64, signature] = parts;
    const secret = getSessionSecret();

    const expectedSignature = crypto.createHmac('sha256', secret).update(dataB64).digest('base64url');

    // Constant time comparison to prevent timing attacks
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const jsonStr = Buffer.from(dataB64, 'base64url').toString('utf-8');
    const data = JSON.parse(jsonStr) as SessionData;

    if (Date.now() > data.expiresAt) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

/**
 * Validates the caller's session across Production (Bearer Firebase ID token) or Demo (Cookie session).
 * Returns { uid, homeId, member } or null.
 */
export async function getSession(req: NextRequest): Promise<SessionResult | null> {
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  // 1. Check for Bearer token in Authorization header (Production / Firebase Auth)
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    try {
      // Dynamic require to prevent importing firebase-admin/auth when not needed
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getAuth } = require('firebase-admin/auth');
      const decoded = await getAuth().verifyIdToken(token);
      const uid = decoded.uid;

      // Extract homeId from token claims, query param, or header
      const homeId = (decoded.homeId as string) || req.nextUrl.searchParams.get('homeId') || 'demo-home-1';

      const storage = getWeddingStorage();
      const member = await storage.getSpeaker(homeId, uid);
      return { uid, homeId, member };
    } catch (err) {
      console.error('Firebase Auth token verification failed:', err);
      // Fall through to cookie check if demo mode enabled
    }
  }

  // 2. Demo mode cookie authentication
  if (isDemoMode) {
    const cookie = req.cookies.get(SESSION_COOKIE_NAME);
    if (cookie && cookie.value) {
      const sessionData = verifySessionPayload(cookie.value);
      if (sessionData) {
        const storage = getWeddingStorage();
        const member = await storage.getSpeaker(sessionData.homeId, sessionData.uid);
        return {
          uid: sessionData.uid,
          homeId: sessionData.homeId,
          member,
        };
      }
    }
  }

  return null;
}

