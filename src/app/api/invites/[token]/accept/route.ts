import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getWeddingStorage } from '@/lib/storage';
import { getSession } from '@/lib/auth/session';

const AcceptInviteSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  relationship: z.string().max(50).optional().default('guest'),
  preferredLanguage: z.string().max(10).optional().default('en'),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Please log in or select a demo member first' },
        { status: 401 }
      );
    }

    const { token } = await context.params;
    const storage = getWeddingStorage();

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
    const memberName = (parsed.success && parsed.data.name) || session.member.name || 'Invited Family Member';
    const relationship = (parsed.success && parsed.data.relationship) || 'family';
    const preferredLanguage = (parsed.success && parsed.data.preferredLanguage) || session.member.preferredLanguage || 'en';

    // Add user as a viewer member of the target home
    const addedMember = await storage.addMemberToHome(invite.homeId, {
      uid: session.uid,
      name: memberName,
      relationship,
      permission: 'viewer',
      preferredLanguage,
      interests: [],
      canSeeBudget: false,
    });

    const home = await storage.getHome(invite.homeId);

    return NextResponse.json({
      success: true,
      message: `Welcome to ${home.name}!`,
      home,
      member: addedMember,
    });
  } catch (error: any) {
    console.error('Error accepting invite:', error);
    return NextResponse.json(
      { success: false, error: 'Server error accepting invite' },
      { status: 500 }
    );
  }
}

