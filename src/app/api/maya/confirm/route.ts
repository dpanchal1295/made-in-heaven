import { checkOrigin } from '@/lib/security/originCheck';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getWeddingStorage } from '@/lib/storage';
import { getSession } from '@/lib/auth/session';

const ConfirmBodySchema = z.object({
  confirmationId: z.string().min(1),
  confirmed: z.boolean(),
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
    const parsed = ConfirmBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid confirmation payload' },
        { status: 400 }
      );
    }

    const { confirmationId, confirmed } = parsed.data;
    const storage = getWeddingStorage();

    if (!confirmed) {
      await storage.rejectConfirmation(session.homeId, confirmationId);
      return NextResponse.json({
        success: true,
        action: 'rejected',
        message: 'Confirmation dismissed',
      });
    }

    const result = await storage.applyConfirmation(
      session.homeId,
      confirmationId,
      session.member.permission
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to apply confirmation' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      action: 'applied',
      profile: result.profile,
      budget: session.member.canSeeBudget ? result.budget : null,
      appliedUpdate: result.appliedUpdate,
    });
  } catch (error: any) {
    console.error('Error in /api/maya/confirm:', error);
    return NextResponse.json(
      { success: false, error: 'Server error processing confirmation' },
      { status: 500 }
    );
  }
}
