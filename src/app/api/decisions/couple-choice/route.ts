import { checkOrigin } from '@/lib/security/originCheck';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getWeddingStorage } from '@/lib/storage';
import { getSession } from '@/lib/auth/session';
import { validateCoupleChoice, DecisionMember } from '@/lib/decisions/tally';
import { executeReplan } from '@/lib/maya/replanEngine';

const CoupleChoiceSchema = z.object({
  decisionId: z.string().min(1),
  optionId: z.string().min(1),
});

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
    const parsed = CoupleChoiceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid couple choice payload' },
        { status: 400 }
      );
    }

    const { decisionId, optionId } = parsed.data;
    const storage = getWeddingStorage();

    const decision = await storage.getDecision(session.homeId, decisionId);
    if (!decision) {
      return NextResponse.json(
        { success: false, error: 'Decision not found' },
        { status: 404 }
      );
    }

    if (decision.status !== 'awaiting_couple') {
      return NextResponse.json(
        { success: false, error: 'This decision is not currently awaiting the couple choice' },
        { status: 400 }
      );
    }

    const memberContext: DecisionMember = {
      uid: session.uid,
      permission: session.member.permission,
    };

    const tiedOptions = decision.tiedOptionIds || decision.options.map((o) => o.id);
    const validationError = validateCoupleChoice(memberContext, optionId, tiedOptions);
    if (validationError) {
      return NextResponse.json(
        { success: false, error: validationError },
        { status: 403 }
      );
    }

    // Close decision with couple's tie-break decision
    decision.status = 'closed';
    decision.result = optionId;
    decision.decidedBy = 'couple';
    decision.closedAt = Date.now();

    await storage.saveDecision(session.homeId, decision);

    // Trigger replan
    await executeReplan(storage, session.homeId, `decision.${decision.id}`, optionId);

    return NextResponse.json({
      success: true,
      outcome: 'closed',
      winner: optionId,
      decidedBy: 'couple',
      decision,
    });
  } catch (error: any) {
    console.error('Error recording couple choice:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record couple choice' },
      { status: 500 }
    );
  }
}

