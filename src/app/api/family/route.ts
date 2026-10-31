import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getWeddingStorage } from '@/lib/storage';
import { getSession } from '@/lib/auth/session';

const UpdateMemberSchema = z.object({
  uid: z.string().min(1),
  permission: z.enum(['couple', 'voter', 'advisor', 'viewer']).optional(),
  canSeeBudget: z.boolean().optional(),
  canVote: z.boolean().optional(),
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
    const members = await storage.getMembers(session.homeId);

    return NextResponse.json({
      success: true,
      members,
      currentUserUid: session.uid,
      currentUserPermission: session.member.permission,
    });
  } catch (error: any) {
    console.error('Error in /api/family GET:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load family members' },
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

    if (session.member.permission !== 'couple') {
      return NextResponse.json(
        { success: false, error: 'Only the couple can manage family permissions' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const parsed = UpdateMemberSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid update payload' },
        { status: 400 }
      );
    }

    const { uid, permission, canSeeBudget, canVote } = parsed.data;
    const storage = getWeddingStorage();

    const updates: Record<string, any> = {};
    if (permission !== undefined) updates.permission = permission;
    if (canSeeBudget !== undefined) updates.canSeeBudget = canSeeBudget;

    // "canVote" toggle directly switches between "voter" and "advisor"
    if (canVote !== undefined) {
      updates.permission = canVote ? 'voter' : 'advisor';
    }

    const updated = await storage.updateMember(session.homeId, uid, updates);

    return NextResponse.json({
      success: true,
      member: updated,
    });
  } catch (error: any) {
    console.error('Error updating family member:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update family member' },
      { status: 500 }
    );
  }
}
