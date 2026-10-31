import { NextRequest, NextResponse } from 'next/server';
import { getSession, verifySessionPayload, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { getWeddingStorage } from '@/lib/storage';

export async function GET(req: NextRequest) {
  try {
    const storage = getWeddingStorage();

    // 1. Try standard active member session (user is in an active celebration home)
    const session = await getSession(req);
    if (session) {
      const [home, user] = await Promise.all([
        storage.getHome(session.homeId).catch(() => null),
        storage.getUser(session.uid).catch(() => null),
      ]);

      let homesList: Array<{ id: string; name: string; eventType?: string }> = [];
      if (user && user.homeIds && user.homeIds.length > 0) {
        const homeDocs = await Promise.all(user.homeIds.map((hid) => storage.getHome(hid).catch(() => null)));
        homesList = homeDocs.filter(Boolean).map((h) => ({
          id: h!.id,
          name: h!.name,
          eventType: h!.profile?.eventType || 'wedding',
        }));
      }

      return NextResponse.json({
        success: true,
        authenticated: true,
        uid: session.uid,
        name: session.member.name,
        email: user?.email,
        isGuest: user?.isGuest ?? false,
        member: session.member,
        homeId: session.homeId,
        homeName: home?.name || 'Celebration',
        eventType: home?.profile?.eventType || 'wedding',
        canSeeBudget: session.member.canSeeBudget,
        permission: session.member.permission,
        homes: homesList,
      });
    }

    // 2. Fallback: User has signed in or created a guest account, but has not yet joined/created a home
    const cookie = req.cookies.get(SESSION_COOKIE_NAME);
    if (cookie?.value) {
      const payload = verifySessionPayload(cookie.value);
      if (payload && payload.uid) {
        const user = await storage.getUser(payload.uid);
        if (user) {
          let homesList: Array<{ id: string; name: string; eventType?: string }> = [];
          if (user.homeIds && user.homeIds.length > 0) {
            const homeDocs = await Promise.all(user.homeIds.map((hid) => storage.getHome(hid).catch(() => null)));
            homesList = homeDocs.filter(Boolean).map((h) => ({
              id: h!.id,
              name: h!.name,
              eventType: h!.profile?.eventType || 'wedding',
            }));
          }

          return NextResponse.json({
            success: true,
            authenticated: true,
            uid: user.uid,
            name: user.name,
            email: user.email,
            isGuest: user.isGuest,
            member: null,
            homeId: null,
            homeName: null,
            canSeeBudget: true,
            permission: 'couple',
            homes: homesList,
          });
        }
      }
    }

    // 3. Unauthenticated
    return NextResponse.json(
      { success: false, authenticated: false, error: 'Unauthorized: No active session' },
      { status: 401 }
    );
  } catch (error: any) {
    console.error('Error in /api/me:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve session details' },
      { status: 500 }
    );
  }
}
