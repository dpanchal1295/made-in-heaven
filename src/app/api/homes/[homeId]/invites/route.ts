import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getWeddingStorage } from '@/lib/storage';
import { getSession } from '@/lib/auth/session';
import { HomeInvite } from '@/types/firestore';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ homeId: string }> }
) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: No active session' },
        { status: 401 }
      );
    }

    const { homeId } = await context.params;
    if (session.homeId !== homeId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You are not a member of this Home' },
        { status: 403 }
      );
    }

    if (session.member.permission !== 'couple') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only the couple can generate invite links' },
        { status: 403 }
      );
    }

    const storage = getWeddingStorage();
    const now = Date.now();
    const token = crypto.randomBytes(16).toString('hex');
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    const invite: HomeInvite = {
      token,
      homeId,
      createdBy: session.uid,
      createdAt: now,
      expiresAt: now + sevenDaysMs,
    };

    await storage.createInvite(invite);

    return NextResponse.json({
      success: true,
      token,
      expiresAt: invite.expiresAt,
      inviteUrl: `/invites/${token}`,
    });
  } catch (error: any) {
    console.error('Error generating invite:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create invite' },
      { status: 500 }
    );
  }
}

