import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  signSessionPayload,
  SESSION_COOKIE_NAME,
  SEEDED_DEMO_UIDS,
  SessionData,
} from '@/lib/auth/session';
import { getWeddingStorage } from '@/lib/storage';

const DemoAuthSchema = z.object({
  uid: z.string().min(1),
  homeId: z.string().optional().default('demo-home-1'),
});

export async function POST(req: NextRequest) {
  try {
    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    if (!isDemoMode) {
      return NextResponse.json(
        { success: false, error: 'Demo authentication is disabled in production mode.' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const parsed = DemoAuthSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { uid, homeId } = parsed.data;

    // Must be one of the seeded demo members
    if (!SEEDED_DEMO_UIDS.includes(uid as any)) {
      return NextResponse.json(
        { success: false, error: `Invalid demo member UID: ${uid}` },
        { status: 403 }
      );
    }

    const storage = getWeddingStorage();
    const member = await storage.getSpeaker(homeId, uid);

    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const sessionPayload: SessionData = {
      uid,
      homeId,
      issuedAt: now,
      expiresAt: now + sevenDaysMs,
    };

    const token = signSessionPayload(sessionPayload);

    const response = NextResponse.json({
      success: true,
      member,
      homeId,
    });

    const isProd = process.env.NODE_ENV === 'production';
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    });

    return response;
  } catch (error: any) {
    console.error('Demo auth error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Authentication error' },
      { status: 500 }
    );
  }
}

