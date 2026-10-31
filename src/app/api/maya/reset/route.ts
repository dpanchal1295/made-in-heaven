import { NextRequest, NextResponse } from 'next/server';
import { getWeddingStorage } from '@/lib/storage';
import { getSession } from '@/lib/auth/session';

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
        { success: false, error: 'Forbidden: Only the couple can reset onboarding data' },
        { status: 403 }
      );
    }

    const storage = getWeddingStorage();
    const result = await storage.resetDemoData(session.homeId);
    const { getOnboardingStatus } = await import('@/lib/utils/format');
    const onboardingStatus = getOnboardingStatus(result.profile, result.budget);

    return NextResponse.json({
      success: true,
      profile: result.profile,
      budget: session.member.canSeeBudget ? result.budget : null,
      onboardingStatus,
      message: 'Demo state reset to initial onboarding state',
    });
  } catch (error: any) {
    console.error('Error resetting demo data:', error);
    return NextResponse.json(
      { success: false, error: 'Server error resetting demo state' },
      { status: 500 }
    );
  }
}
