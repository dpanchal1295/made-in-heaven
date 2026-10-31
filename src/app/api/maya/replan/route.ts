import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getWeddingStorage } from '@/lib/storage';
import { getSession } from '@/lib/auth/session';
import { executeReplan } from '@/lib/maya/replanEngine';

const ReplanBodySchema = z.object({
  change: z.object({
    path: z.string().min(1),
    value: z.any(),
  }),
});

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
    const parsed = ReplanBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid replan payload: change.path and change.value are required' },
        { status: 400 }
      );
    }

    const { path, value } = parsed.data.change;
    const isBudgetOrLocked = path.startsWith('budget') || path.startsWith('locked_constraints');

    if (isBudgetOrLocked && session.member.permission !== 'couple') {
      return NextResponse.json(
        { success: false, error: 'Only the couple can modify budget or locked constraints during replan' },
        { status: 403 }
      );
    }

    const storage = getWeddingStorage();

    // 1. Apply the parameter update to storage
    await storage.applyProfileUpdates(
      session.homeId,
      [{ path, value, action: 'set', reason: 'Replan requested by member' }],
      session.member.permission
    );

    // 2. Execute replan engine to regenerate affected plan parts
    const replanResult = await executeReplan(storage, session.homeId, path, value);

    const safePlan = session.member.canSeeBudget
      ? replanResult.plan
      : { ...replanResult.plan, budget: null };

    return NextResponse.json({
      success: true,
      plan: safePlan,
      changes: replanResult.changes,
    });
  } catch (error: any) {
    console.error('Error during replan:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to execute replan' },
      { status: 500 }
    );
  }
}

