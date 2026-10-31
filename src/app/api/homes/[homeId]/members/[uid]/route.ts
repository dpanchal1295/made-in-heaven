import { checkOrigin } from '@/lib/security/originCheck';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getWeddingStorage } from '@/lib/storage';
import { getSession } from '@/lib/auth/session';

const PatchMemberSchema = z.object({
  permission: z.enum(['couple', 'voter', 'advisor', 'viewer']).optional(),
  canVote: z.boolean().optional(),
  canSeeBudget: z.boolean().optional(),
  preferredLanguage: z.string().max(10).optional(),
});

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ homeId: string; uid: string }> }
) {
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

    const { homeId, uid } = await context.params;
    if (session.homeId !== homeId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Not a member of this Home' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const parsed = PatchMemberSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid update parameters' },
        { status: 400 }
      );
    }

    const { permission, canVote, canSeeBudget, preferredLanguage } = parsed.data;
    const isCallerCouple = session.member.permission === 'couple';
    const isSelf = session.uid === uid;

    // Couple-only controls check: permission, canVote, canSeeBudget
    if ((permission !== undefined || canVote !== undefined || canSeeBudget !== undefined) && !isCallerCouple) {
      return NextResponse.json(
        { success: false, error: 'Only the couple can change permissions, voting eligibility, or budget access' },
        { status: 403 }
      );
    }

    // A regular member can only change their own preferredLanguage
    if (!isCallerCouple && !isSelf) {
      return NextResponse.json(
        { success: false, error: 'You can only update your own profile details' },
        { status: 403 }
      );
    }

    const updates: Record<string, any> = {};
    if (isCallerCouple) {
      if (permission !== undefined) updates.permission = permission;
      if (canVote !== undefined) {
        updates.permission = canVote ? 'voter' : 'advisor';
      }
      if (canSeeBudget !== undefined) updates.canSeeBudget = canSeeBudget;
    }

    if (preferredLanguage !== undefined) {
      updates.preferredLanguage = preferredLanguage;
    }

    const storage = getWeddingStorage();
    const updatedMember = await storage.updateMember(homeId, uid, updates);

    return NextResponse.json({
      success: true,
      member: updatedMember,
    });
  } catch (error: any) {
    console.error('Error updating member:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update member' },
      { status: 500 }
    );
  }
}

