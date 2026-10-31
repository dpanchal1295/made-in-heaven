import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getWeddingStorage } from '@/lib/storage';
import { verifySessionPayload, SESSION_COOKIE_NAME, signSessionPayload } from '@/lib/auth/session';
import { checkRateLimit } from '@/lib/security/rateLimit';
import { checkOrigin, getClientIp } from '@/lib/security/originCheck';

const CreateHomeSchema = z.object({
  coupleNames: z.string().min(1).max(100),
  date: z.string().optional(),
  city: z.string().optional(),
  eventType: z.enum(['wedding', 'birthday', 'community']).optional().default('wedding'),
  eventSubtype: z.string().max(100).optional(),
  preferredLanguage: z.string().max(10).optional().default('en'),
});

export async function POST(req: NextRequest) {
  if (!checkOrigin(req)) {
    return NextResponse.json({ success: false, error: 'Forbidden: Invalid origin' }, { status: 403 });
  }

  // Rate-limit home creation per IP (max 10 per hour)
  const clientIp = getClientIp(req);
  const rateLimit = checkRateLimit(`home_create_${clientIp}`, 10, 60 * 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many celebration homes created. Please wait before creating another.' },
      { status: 429 }
    );
  }

  try {
    const cookie = req.cookies.get(SESSION_COOKIE_NAME);
    if (!cookie?.value) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Please sign in or continue as guest first' },
        { status: 401 }
      );
    }

    const payload = verifySessionPayload(cookie.value);
    if (!payload || !payload.uid) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid or expired session' },
        { status: 401 }
      );
    }

    const storage = getWeddingStorage();
    const user = await storage.getUser(payload.uid);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User record not found' },
        { status: 404 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const parsed = CreateHomeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid home creation payload' },
        { status: 400 }
      );
    }

    const { coupleNames, date, city, eventType, eventSubtype, preferredLanguage } = parsed.data;

    const result = await storage.createHomeWithDetails({
      coupleNames,
      date,
      city,
      ownerUid: user.uid,
      ownerName: user.name || coupleNames,
      preferredLanguage: preferredLanguage || 'en',
      eventType,
      eventSubtype,
    });

    // Update user record with new home
    const existingHomeIds = user.homeIds || [];
    if (!existingHomeIds.includes(result.home.id)) {
      existingHomeIds.push(result.home.id);
    }
    user.homeIds = existingHomeIds;
    user.activeHomeId = result.home.id;
    user.updatedAt = Date.now();
    await storage.saveUser(user);

    // Update session cookie with active homeId
    const now = Date.now();
    const expiresAt = now + 7 * 24 * 60 * 60 * 1000;
    const signedToken = signSessionPayload({
      uid: user.uid,
      homeId: result.home.id,
      issuedAt: now,
      expiresAt,
    });

    const isProd = process.env.NODE_ENV === 'production';
    const response = NextResponse.json({
      success: true,
      home: result.home,
      member: result.member,
    });

    response.cookies.set(SESSION_COOKIE_NAME, signedToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      expires: new Date(expiresAt),
    });

    return response;
  } catch (error: any) {
    console.error('Error creating celebration home:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create celebration home' },
      { status: 500 }
    );
  }
}
