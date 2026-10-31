import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getWeddingStorage } from '@/lib/storage';

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
    const home = await storage.getHome(session.homeId);

    return NextResponse.json({
      success: true,
      member: session.member,
      homeId: session.homeId,
      homeName: home.name,
      canSeeBudget: session.member.canSeeBudget,
      permission: session.member.permission,
    });
  } catch (error: any) {
    console.error('Error in /api/me:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve session details' },
      { status: 500 }
    );
  }
}
