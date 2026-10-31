import { checkOrigin } from '@/lib/security/originCheck';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getWeddingStorage } from '@/lib/storage';
import { getSession } from '@/lib/auth/session';

const IdeaBodySchema = z.object({
  text: z.string().min(1).max(2000),
});

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ homeId: string; roomId: string }> }
) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: No active session' },
        { status: 401 }
      );
    }

    const { homeId, roomId } = await context.params;
    if (session.homeId !== homeId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Not a member of this Home' },
        { status: 403 }
      );
    }

    const sinceParam = req.nextUrl.searchParams.get('since');
    const since = sinceParam ? Number(sinceParam) : undefined;

    const storage = getWeddingStorage();
    const ideas = await storage.getIdeas(homeId, roomId, since);

    return NextResponse.json({
      success: true,
      ideas,
    });
  } catch (error: any) {
    console.error('Error fetching room ideas:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve ideas' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ homeId: string; roomId: string }> }
) {
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

    const { homeId, roomId } = await context.params;
    if (session.homeId !== homeId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Not a member of this Home' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const parsed = IdeaBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid idea text or text exceeds 2,000 characters' },
        { status: 400 }
      );
    }

    const storage = getWeddingStorage();
    const createdIdea = await storage.addIdea(homeId, roomId, {
      authorUid: session.uid,
      authorName: session.member.name,
      text: parsed.data.text.trim(),
    });

    return NextResponse.json({
      success: true,
      idea: createdIdea,
    });
  } catch (error: any) {
    console.error('Error posting idea:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to post idea' },
      { status: 500 }
    );
  }
}

