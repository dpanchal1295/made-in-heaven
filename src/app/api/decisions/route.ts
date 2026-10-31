import { checkOrigin } from '@/lib/security/originCheck';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { getWeddingStorage } from '@/lib/storage';
import { getSession } from '@/lib/auth/session';
import { Decision, DecisionOption } from '@/types/firestore';

const CreateDecisionSchema = z.object({
  roomId: z.string().min(1),
  topic: z.string().min(1).max(200),
  options: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      what_it_includes: z.string(),
      who_gets_what: z.array(z.object({ member: z.string(), gets: z.string() })).optional().default([]),
      cost_tier: z.string().optional().default('₹₹'),
      fits_locked_constraints: z.boolean().optional().default(true),
      fits_budget: z.boolean().optional().default(true),
    })
  ).min(2),
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
    const decisions = await storage.getDecisions(session.homeId);

    return NextResponse.json({
      success: true,
      decisions,
    });
  } catch (error: any) {
    console.error('Error fetching decisions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve decisions' },
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

    if (session.member.permission !== 'couple') {
      return NextResponse.json(
        { success: false, error: 'Only the couple can create decisions from briefs' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const parsed = CreateDecisionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid decision payload or fewer than 2 options' },
        { status: 400 }
      );
    }

    const { roomId, topic, options } = parsed.data;
    const storage = getWeddingStorage();
    const decisionId = `dec_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

    const newDecision: Decision = {
      id: decisionId,
      roomId,
      topic,
      options: options as DecisionOption[],
      votes: {},
      status: 'open',
      round: 'first',
    };

    await storage.saveDecision(session.homeId, newDecision);

    return NextResponse.json({
      success: true,
      decision: newDecision,
    });
  } catch (error: any) {
    console.error('Error creating decision:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create decision' },
      { status: 500 }
    );
  }
}

