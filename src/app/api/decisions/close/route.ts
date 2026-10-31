import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getWeddingStorage } from '@/lib/storage';
import { getSession } from '@/lib/auth/session';
import { tallyRound, DecisionMember, DecisionRound } from '@/lib/decisions/tally';
import { executeReplan } from '@/lib/maya/replanEngine';

const CloseDecisionSchema = z.object({
  decisionId: z.string().min(1),
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

    if (session.member.permission !== 'couple') {
      return NextResponse.json(
        { success: false, error: 'Only the couple has permission to close or tally decisions' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const parsed = CloseDecisionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid close decision payload' },
        { status: 400 }
      );
    }

    const { decisionId } = parsed.data;
    const storage = getWeddingStorage();

    const [decision, members] = await Promise.all([
      storage.getDecision(session.homeId, decisionId),
      storage.getMembers(session.homeId),
    ]);

    if (!decision) {
      return NextResponse.json(
        { success: false, error: 'Decision not found' },
        { status: 404 }
      );
    }

    if (decision.status === 'closed') {
      return NextResponse.json(
        { success: false, error: 'This decision is already closed' },
        { status: 400 }
      );
    }

    const activeOptionIds =
      decision.status === 'runoff' && decision.runoffOptionIds
        ? decision.runoffOptionIds
        : decision.options.map((o) => o.id);

    const round: DecisionRound = decision.round || (decision.status === 'runoff' ? 'runoff' : 'first');
    const memberContexts: DecisionMember[] = members.map((m) => ({
      uid: m.uid,
      permission: m.permission,
    }));

    const tally = tallyRound(activeOptionIds, decision.votes || {}, memberContexts, round);

    if (tally.kind === 'no_votes') {
      return NextResponse.json({
        success: false,
        error: 'No votes have been cast yet. The decision remains open for voters.',
        decision,
      });
    }

    if (tally.kind === 'winner') {
      decision.status = 'closed';
      decision.result = tally.optionId;
      decision.decidedBy = tally.decidedBy;
      decision.closedAt = Date.now();

      await storage.saveDecision(session.homeId, decision);

      // Trigger replan to update plan with closed decision result
      await executeReplan(storage, session.homeId, `decision.${decision.id}`, tally.optionId);

      return NextResponse.json({
        success: true,
        outcome: 'winner',
        winner: tally.optionId,
        decidedBy: tally.decidedBy,
        counts: tally.counts,
        decision,
      });
    }

    if (tally.kind === 'runoff') {
      decision.status = 'runoff';
      decision.round = 'runoff';
      decision.runoffOptionIds = tally.optionIds;
      decision.votes = {}; // Reset votes for the runoff round

      await storage.saveDecision(session.homeId, decision);

      return NextResponse.json({
        success: true,
        outcome: 'runoff',
        runoffOptions: tally.optionIds,
        message: 'No candidate achieved a strict majority. A runoff has commenced between the top two options.',
        decision,
      });
    }

    if (tally.kind === 'couple_decides') {
      decision.status = 'awaiting_couple';
      decision.tiedOptionIds = tally.optionIds;

      await storage.saveDecision(session.homeId, decision);

      return NextResponse.json({
        success: true,
        outcome: 'couple_decides',
        tiedOptions: tally.optionIds,
        message: 'A tie has occurred. The couple may now make the final choice.',
        decision,
      });
    }

    return NextResponse.json({ success: false, error: 'Unknown outcome' }, { status: 500 });
  } catch (error: any) {
    console.error('Error closing decision:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to close decision' },
      { status: 500 }
    );
  }
}

