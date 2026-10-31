import { NextRequest, NextResponse } from 'next/server';
import { getWeddingStorage } from '@/lib/storage';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Invite token is required' },
        { status: 400 }
      );
    }

    const storage = getWeddingStorage();
    const invite = await storage.getInvite(token);
    if (!invite) {
      return NextResponse.json(
        { success: false, error: 'Invite not found or invalid' },
        { status: 404 }
      );
    }

    if (Date.now() > invite.expiresAt) {
      return NextResponse.json(
        { success: false, error: 'This invite has expired. Please ask for a new link.' },
        { status: 410 }
      );
    }

    const [home, creator] = await Promise.all([
      storage.getHome(invite.homeId).catch(() => null),
      invite.createdBy ? storage.getUser(invite.createdBy).catch(() => null) : null,
    ]);

    if (!home) {
      return NextResponse.json(
        { success: false, error: 'The celebration associated with this invite no longer exists.' },
        { status: 404 }
      );
    }

    const members = await storage.getMembers(invite.homeId).catch(() => []);
    const inviterMember = members.find((m) => m.uid === invite.createdBy);
    const inviterName = inviterMember?.name || creator?.name || 'A celebration host';

    return NextResponse.json({
      success: true,
      invite: {
        token: invite.token,
        homeId: invite.homeId,
        homeName: home.name,
        eventType: home.profile?.eventType || 'wedding',
        permission: (invite as any).permission || 'voter',
        inviterName,
        expiresAt: invite.expiresAt,
      },
    });
  } catch (error) {
    console.error('Error fetching invite details:', error);
    return NextResponse.json(
      { success: false, error: 'Server error retrieving invite details' },
      { status: 500 }
    );
  }
}

