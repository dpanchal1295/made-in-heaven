import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getWeddingStorage } from '@/lib/storage';
import { getSession } from '@/lib/auth/session';

const UpdateSettingsSchema = z.object({
  action: z.enum(['update_profile', 'update_communication']),
  preferredLanguage: z.string().optional(),
  name: z.string().optional(),
  relationship: z.string().optional(),
  honestyPreference: z.enum(['gentle', 'balanced', 'straight-to-the-point']).optional(),
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
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: No active session' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const parsed = UpdateSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid settings payload' },
        { status: 400 }
      );
    }

    const { action, preferredLanguage, name, relationship, honestyPreference } = parsed.data;
    const storage = getWeddingStorage();

    if (action === 'update_profile') {
      const updates: Record<string, string> = {};
      if (preferredLanguage) updates.preferredLanguage = preferredLanguage;
      if (name) updates.name = name.trim();
      if (relationship) updates.relationship = relationship.trim();

      const updated = await storage.updateMember(session.homeId, session.uid, updates);
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
