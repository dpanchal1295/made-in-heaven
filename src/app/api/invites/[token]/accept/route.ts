import { checkOrigin } from '@/lib/security/originCheck';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getWeddingStorage } from '@/lib/storage';
import { verifySessionPayload, SESSION_COOKIE_NAME, signSessionPayload } from '@/lib/auth/session';

const AcceptInviteSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  relationship: z.string().max(50).optional().default('family'),
  preferredLanguage: z.string().max(10).optional().default('en'),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  if (!checkOrigin(req as any)) {
    return NextResponse.json({ success: false, error: 'Forbidden: Invalid origin' }, { status: 403 });
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

    const { token } = await context.params;
    const invite = await storage.getInvite(token);
    if (!invite) {
      return NextResponse.json(
        { success: false, error: 'Invite token is invalid or does not exist' },
        { status: 404 }
      );
    }

    if (Date.now() > invite.expiresAt) {
      await storage.deleteInvite(token);
      return NextResponse.json(
        { success: false, error: 'This invite has expired. Please request a new one.' },
        { status: 410 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const parsed = AcceptInviteSchema.safeParse(body);
    const memberName = (parsed.success && parsed.data.name?.trim()) || user.name || 'Invited Member';
    const relationship = (parsed.success && parsed.data.relationship?.trim()) || 'family';
    const preferredLanguage = (parsed.success && parsed.data.preferredLanguage?.trim()) || 'en';

    // The invite record defines the assigned permission (default 'viewer' or 'voter'/'advisor' if created with it)
    const permission = (invite as any).permission || 'voter';
    const canSeeBudget = permission === 'couple' || permission === 'voter';

    const addedMember = await storage.addMemberToHome(invite.homeId, {
      uid: user.uid,
      name: memberName,
      relationship,
      permission,
      preferredLanguage,
      interests: [],
      canSeeBudget,
    });

    // Append homeId to user record and set active
    const homeIds = user.homeIds || [];
    if (!homeIds.includes(invite.homeId)) {
      homeIds.push(invite.homeId);
    }
    user.homeIds = homeIds;
    user.activeHomeId = invite.homeId;
    user.updatedAt = Date.now();
    await storage.saveUser(user);

    // Update session cookie with the new active homeId
    const now = Date.now();
    const expiresAt = now + 7 * 24 * 60 * 60 * 1000;
    const signedToken = signSessionPayload({
      uid: user.uid,
      homeId: invite.homeId,
      issuedAt: now,
      expiresAt,
    });

    const home = await storage.getHome(invite.homeId);

    const isProd = process.env.NODE_ENV === 'production';
    const response = NextResponse.json({
      success: true,
      message: `Welcome to ${home.name}!`,
      home,
      member: addedMember,
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
    console.error('Error accepting invite:', error);
    return NextResponse.json(
      { success: false, error: 'Server error accepting invite' },
      { status: 500 }
    );
  }
}
