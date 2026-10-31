import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminAuth } from '@/lib/firebase/admin';
import { getWeddingStorage } from '@/lib/storage';
import { SESSION_COOKIE_NAME, signSessionPayload } from '@/lib/auth/session';
import { checkOrigin } from '@/lib/security/originCheck';

const SessionBodySchema = z.object({
  idToken: z.string().min(1),
  displayName: z.string().optional(),
});

export async function POST(req: NextRequest) {
  if (!checkOrigin(req)) {
    return NextResponse.json({ success: false, error: 'Forbidden: Invalid origin' }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = SessionBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Valid idToken is required' }, { status: 400 });
    }

    const { idToken, displayName } = parsed.data;

    // Verify Firebase ID Token via firebase-admin
    const decodedToken = await getAdminAuth().verifyIdToken(idToken);
    const { uid, email, name: tokenName } = decodedToken;
    const finalName = displayName?.trim() || tokenName || email?.split('@')[0] || 'Celebration Host';

    const storage = getWeddingStorage();
    const existingUser = await storage.getUser(uid);

    const now = Date.now();
    const userRecord = {
      uid,
      name: finalName,
      email: email || undefined,
      isGuest: false,
      homeIds: existingUser?.homeIds || [],
      activeHomeId: existingUser?.activeHomeId || (existingUser?.homeIds?.[0] ?? undefined),
      createdAt: existingUser?.createdAt || now,
      updatedAt: now,
    };

    await storage.saveUser(userRecord);

    // 7-day session cookie
    const expiresAt = now + 7 * 24 * 60 * 60 * 1000;
    const signedToken = signSessionPayload({
      uid,
      homeId: userRecord.activeHomeId,
      issuedAt: now,
      expiresAt,
    });

    const isProd = process.env.NODE_ENV === 'production';
    const response = NextResponse.json({
      success: true,
      user: {
        uid: userRecord.uid,
        name: userRecord.name,
        email: userRecord.email,
        isGuest: false,
        homeIds: userRecord.homeIds,
        activeHomeId: userRecord.activeHomeId,
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
    console.error('Session establishment error:', err);
    return NextResponse.json(
      { success: false, error: 'Invalid or expired Firebase ID token' },
      { status: 401 }
    );
  }
}

