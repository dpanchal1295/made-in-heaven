import { checkOrigin } from '@/lib/security/originCheck';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getWeddingStorage } from '@/lib/storage';
import { getSession } from '@/lib/auth/session';
import { getOnboardingStatus } from '@/lib/utils/format';

const JoinHomeSchema = z.object({
  inviteCode: z.string().min(1),
  name: z.string().min(1),
  relationship: z.string().optional().default('family'),
  preferredLanguage: z.string().optional().default('en'),
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
    const [home, budget, members, rooms] = await Promise.all([
      storage.getHome(session.homeId),
      storage.getBudget(session.homeId),
      storage.getMembers(session.homeId),
      storage.getRooms(session.homeId),
    ]);

    const onboardingStatus = getOnboardingStatus(home.profile, budget);

    return NextResponse.json({
      success: true,
      home,
      speaker: session.member,
      members,
      rooms,
      budget: session.member.canSeeBudget ? budget : null,
      onboardingStatus,
    });
  } catch (error: any) {
    console.error('Error fetching home state:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load home dashboard state' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  if (!checkOrigin(req as any)) {
    return NextResponse.json({ success: false, error: 'Forbidden: Invalid origin' }, { status: 403 });
  }
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: No active session' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const parsed = JoinHomeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid join home payload' },
        { status: 400 }
      );
    }

    const { inviteCode, name, relationship, preferredLanguage } = parsed.data;
    const storage = getWeddingStorage();

    const targetHome = await storage.getHomeByInviteCode(inviteCode);
    if (!targetHome) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired invite code' },
        { status: 404 }
      );
    }

    const newMember = await storage.addMemberToHome(targetHome.id, {
      uid: session.uid,
      name,
      relationship,
      permission: 'viewer', // default permission for invited users
      preferredLanguage,
      interests: [],
      canSeeBudget: false,
    });

    return NextResponse.json({
      success: true,
      home: targetHome,
      member: newMember,
    });
  } catch (error: any) {
    console.error('Error joining home:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to join home' },
      { status: 500 }
    );
  }
}
