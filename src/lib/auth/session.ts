import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { Member } from '@/types/firestore';
import { getWeddingStorage } from '@/lib/storage';

export const SESSION_COOKIE_NAME = 'mih_session';

export interface SessionData {
  uid: string;
  homeId?: string;
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
    // In test environments or fallback
    return 'dev-session-secret-change-in-production-made-in-heaven';
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
 * Validates the caller's session from the signed httpOnly session cookie.
 * Supports Bearer token fallback for API consumers.
 * Returns { uid, homeId, member } or null.
 */
export async function getSession(req: NextRequest): Promise<SessionResult | null> {
  const storage = getWeddingStorage();

  // 1. Check for signed session cookie (Production Google or Guest sessions)
  const cookie = req.cookies.get(SESSION_COOKIE_NAME);
  if (cookie && cookie.value) {
    const sessionData = verifySessionPayload(cookie.value);
    if (sessionData && sessionData.uid) {
      // Determine active homeId: from request header/query param override, or session, or user record
      let homeId = req.headers.get('x-home-id') || req.nextUrl.searchParams.get('homeId') || sessionData.homeId;
      
      if (!homeId) {
        const user = await storage.getUser(sessionData.uid);
        if (user && user.activeHomeId) {
          homeId = user.activeHomeId;
        } else if (user && user.homeIds && user.homeIds.length > 0) {
          homeId = user.homeIds[0];
        }
      }

      if (homeId) {
        try {
          const member = await storage.getSpeaker(homeId, sessionData.uid);
          return {
            uid: sessionData.uid,
            homeId,
            member,
          };
        } catch {
          // User might not be a member of this home or home doesn't exist
          return null;
        }
      }
    }
  }

  // 2. Check for Bearer token in Authorization header (Firebase Auth fallback)
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getAdminAuth } = require('@/lib/firebase/admin');
      const decoded = await getAdminAuth().verifyIdToken(token);
      const uid = decoded.uid;
      let homeId = req.headers.get('x-home-id') || req.nextUrl.searchParams.get('homeId') || (decoded.homeId as string);

      if (!homeId) {
        const user = await storage.getUser(uid);
        if (user && user.activeHomeId) {
          homeId = user.activeHomeId;
        } else if (user && user.homeIds && user.homeIds.length > 0) {
          homeId = user.homeIds[0];
        }
      }

      if (homeId) {
        const member = await storage.getSpeaker(homeId, uid);
        return { uid, homeId, member };
      }
    } catch (err) {
      console.error('Firebase Auth Bearer token verification failed:', err);
    }
  }

  return null;
}
