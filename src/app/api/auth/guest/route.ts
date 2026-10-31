import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getWeddingStorage } from '@/lib/storage';
import { SESSION_COOKIE_NAME, signSessionPayload } from '@/lib/auth/session';
import { checkRateLimit } from '@/lib/security/rateLimit';
import { checkOrigin, getClientIp } from '@/lib/security/originCheck';

const GuestBodySchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
});

export async function POST(req: NextRequest) {
  if (!checkOrigin(req)) {
    return NextResponse.json({ success: false, error: 'Forbidden: Invalid origin' }, { status: 403 });
  }

  // Rate-limit guest creation per IP (max 20 per hour)
  const clientIp = getClientIp(req);
  const rateLimit = checkRateLimit(`guest_create_${clientIp}`, 20, 60 * 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many guest sessions created. Please try again later.' },
      { status: 429 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = GuestBodySchema.safeParse(body);
    const displayName = (parsed.success && parsed.data.displayName?.trim()) || '';

    const uid = `guest_${crypto.randomUUID()}`;
    const now = Date.now();
    const expiresAt = now + 7 * 24 * 60 * 60 * 1000;

    const userRecord = {
      uid,
      name: displayName,
      isGuest: true,
      homeIds: [],
      createdAt: now,
      updatedAt: now,
    };

    const storage = getWeddingStorage();
    await storage.saveUser(userRecord);

    const signedToken = signSessionPayload({
      uid,
      issuedAt: now,
      expiresAt,
    });

    const isProd = process.env.NODE_ENV === 'production';
    const response = NextResponse.json({
      success: true,
      user: {
        uid: userRecord.uid,
        name: userRecord.name,
        isGuest: true,
        homeIds: [],
      },
    });

    response.cookies.set(SESSION_COOKIE_NAME, signedToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      expires: new Date(expiresAt),
    });

    return response;
  } catch (err: any) {
    console.error('Guest creation error:', err);
    return NextResponse.json({ success: false, error: 'Failed to create guest session' }, { status: 500 });
  }
}

