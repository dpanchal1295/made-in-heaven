import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getWeddingStorage } from '@/lib/storage';
import { getSession } from '@/lib/auth/session';
import { validateVote, DecisionMember } from '@/lib/decisions/tally';

const VoteBodySchema = z.object({
  decisionId: z.string().min(1),
  optionId: z.string().min(1),
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
    const parsed = VoteBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid vote payload' },
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

    const memberContext: DecisionMember = {
      uid: session.uid,
      permission: session.member.permission,
    };

    const activeOptionIds =
      decision.status === 'runoff' && decision.runoffOptionIds
        ? decision.runoffOptionIds
        : decision.options.map((o) => o.id);

    const validationError = validateVote(
      memberContext,
      optionId,
      activeOptionIds,
      decision.status
    );

    if (validationError) {
      return NextResponse.json(
        { success: false, error: validationError },
        { status: 403 }
      );
    }

    // Record or update vote (a later vote replaces an earlier one)
    if (!decision.votes) decision.votes = {};
    decision.votes[session.uid] = optionId;

    await storage.saveDecision(session.homeId, decision);

    return NextResponse.json({
      success: true,
      message: 'Vote cast successfully',
      decision,
    });
  } catch (error: any) {
    console.error('Error casting vote:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record vote' },
      { status: 500 }
    );
  }
}

