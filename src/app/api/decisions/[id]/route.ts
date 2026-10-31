import { NextRequest, NextResponse } from 'next/server';
import { getWeddingStorage } from '@/lib/storage';
import { getSession } from '@/lib/auth/session';
import { countVotes } from '@/lib/decisions/tally';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: No active session' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const storage = getWeddingStorage();

    const [decision, members] = await Promise.all([
      storage.getDecision(session.homeId, id),
      storage.getMembers(session.homeId),
    ]);

    if (!decision) {
      return NextResponse.json(
        { success: false, error: 'Decision not found' },
        { status: 404 }
      );
    }

    const activeOptionIds =
      decision.status === 'runoff' && decision.runoffOptionIds
        ? decision.runoffOptionIds
        : decision.options.map((o) => o.id);

    const tally = countVotes(
      activeOptionIds,
      decision.votes || {},
      members.map((m) => ({ uid: m.uid, permission: m.permission }))
    );

    return NextResponse.json({
      success: true,
      decision,
      tally,
    });
  } catch (error: any) {
    console.error('Error fetching decision:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve decision' },
      { status: 500 }
    );
  }
}

