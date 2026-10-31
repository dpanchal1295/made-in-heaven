import { NextRequest, NextResponse } from 'next/server';
import { getWeddingStorage } from '@/lib/storage';
import { getSession } from '@/lib/auth/session';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ homeId: string }> }
) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: No active session' },
        { status: 401 }
      );
    }

    const { homeId } = await context.params;
    if (session.homeId !== homeId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Not a member of this Home' },
        { status: 403 }
      );
    }

    const storage = getWeddingStorage();
    const rooms = await storage.getRooms(homeId);

    return NextResponse.json({
      success: true,
      rooms,
    });
  } catch (error: any) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve rooms' },
      { status: 500 }
    );
  }
}

