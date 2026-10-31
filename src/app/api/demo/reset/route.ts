import { NextRequest, NextResponse } from 'next/server';
import { getWeddingStorage } from '@/lib/storage';
import { getSession } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  try {
    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    if (!isDemoMode) {
      return NextResponse.json(
        { success: false, error: 'Demo reset is only available in demo mode' },
        { status: 403 }
      );
    }

    const session = await getSession(req);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: No active session' },
        { status: 401 }
      );
    }

    if (session.member.permission !== 'couple') {
      return NextResponse.json(
        { success: false, error: 'Only the couple can reset the demo home' },
        { status: 403 }
      );
    }

    const storage = getWeddingStorage();
    await storage.resetAllDemoData();

    return NextResponse.json({
      success: true,
      message: 'Demo home has been restored to clean canonical state',
    });
  } catch (error: any) {
    console.error('Error in /api/demo/reset:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reset demo data' },
      { status: 500 }
    );
  }
}

