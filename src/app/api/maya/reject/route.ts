import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getWeddingStorage } from '@/lib/storage';
import { getSession } from '@/lib/auth/session';

const RejectBodySchema = z.object({
  confirmationId: z.string().min(1),
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
    const parsed = RejectBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid rejection payload' },
        { status: 400 }
      );
    }

    const { confirmationId } = parsed.data;
    const storage = getWeddingStorage();
    await storage.rejectConfirmation(session.homeId, confirmationId);

    return NextResponse.json({
      success: true,
      message: 'Confirmation dismissed successfully',
    });
  } catch (error: any) {
    console.error('Error rejecting confirmation:', error);
    return NextResponse.json(
      { success: false, error: 'Server error dismissing confirmation' },
      { status: 500 }
    );
  }
}
