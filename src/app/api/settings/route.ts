import { checkOrigin } from '@/lib/security/originCheck';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getWeddingStorage } from '@/lib/storage';
import { getSession, verifySessionPayload, signSessionPayload, SESSION_COOKIE_NAME } from '@/lib/auth/session';

const UpdateSettingsSchema = z.object({
  action: z.enum(['update_profile', 'update_communication', 'switch_home']),
  preferredLanguage: z.string().optional(),
  name: z.string().optional(),
  relationship: z.string().optional(),
  honestyPreference: z.enum(['gentle', 'balanced', 'straight-to-the-point']).optional(),
  homeId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: No active session' },
        { status: 401 }
      );
    }

    const storage = getWeddingStorage();
    const home = await storage.getHome(session.homeId);

    return NextResponse.json({
      success: true,
      speaker: session.member,
      communicationStyle: home.profile?.communication_style || {
        honesty_preference: 'balanced',
      },
    });
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load user settings' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  if (!checkOrigin(req as any)) {
    return NextResponse.json({ success: false, error: 'Forbidden: Invalid origin' }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = UpdateSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid settings payload' },
        { status: 400 }
      );
    }

    const { action, preferredLanguage, name, relationship, honestyPreference, homeId } = parsed.data;
    const storage = getWeddingStorage();

    // 1. Switch home action (works even if user is switching to a different home they belong to)
    if (action === 'switch_home') {
      if (!homeId) {
        return NextResponse.json({ success: false, error: 'homeId is required' }, { status: 400 });
      }

      const cookie = req.cookies.get(SESSION_COOKIE_NAME);
      if (!cookie?.value) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }
      const payload = verifySessionPayload(cookie.value);
      if (!payload || !payload.uid) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }

      const user = await storage.getUser(payload.uid);
      if (!user || !user.homeIds.includes(homeId)) {
        return NextResponse.json({ success: false, error: 'User is not a member of this celebration' }, { status: 403 });
      }

      user.activeHomeId = homeId;
      user.updatedAt = Date.now();
      await storage.saveUser(user);

      const now = Date.now();
      const expiresAt = now + 7 * 24 * 60 * 60 * 1000;
      const signedToken = signSessionPayload({
        uid: user.uid,
        homeId,
        issuedAt: now,
        expiresAt,
      });

      const response = NextResponse.json({ success: true, activeHomeId: homeId });
      response.cookies.set(SESSION_COOKIE_NAME, signedToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        expires: new Date(expiresAt),
      });

      return response;
    }

    // Other actions require an active session
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: No active session' },
        { status: 401 }
      );
    }

    if (action === 'update_profile') {
      const updates: Record<string, string> = {};
      if (preferredLanguage) updates.preferredLanguage = preferredLanguage;
      if (name) updates.name = name.trim();
      if (relationship) updates.relationship = relationship.trim();

      const updated = await storage.updateMember(session.homeId, session.uid, updates);
      
      // Also update name on user record if changed
      if (name) {
        const user = await storage.getUser(session.uid);
        if (user) {
          user.name = name.trim();
          user.updatedAt = Date.now();
          await storage.saveUser(user);
        }
      }

      return NextResponse.json({
        success: true,
        member: updated,
      });
    }

    if (action === 'update_communication') {
      if (session.member.permission !== 'couple') {
        return NextResponse.json(
          { success: false, error: 'Only the couple can change communication style preferences' },
          { status: 403 }
        );
      }

      if (!honestyPreference) {
        return NextResponse.json(
          { success: false, error: 'Honesty preference is required' },
          { status: 400 }
        );
      }

      const updatedProfile = await storage.updateCommunicationStyle(session.homeId, honestyPreference);
      return NextResponse.json({
        success: true,
        profile: updatedProfile,
      });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
