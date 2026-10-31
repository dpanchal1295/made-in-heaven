import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getWeddingStorage } from '@/lib/storage';
import { getSession } from '@/lib/auth/session';

const MessageBodySchema = z.object({
  text: z.string().min(1).max(2000),
  lang: z.string().optional().default('en'),
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
    const limit = Number(req.nextUrl.searchParams.get('limit') || '50');

    const storage = getWeddingStorage();
    let messages = await storage.getRecentMessages(homeId, roomId, limit);

    if (since !== undefined && !isNaN(since)) {
      messages = messages.filter((m) => m.createdAt > since);
    }

    return NextResponse.json({
      success: true,
      messages,
    });
  } catch (error: any) {
    console.error('Error fetching room messages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve messages' },
      { status: 500 }
    );
  }
}

export async function POST(
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

    const body = await req.json().catch(() => ({}));
    const parsed = MessageBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid message body or text exceeds 2,000 characters' },
        { status: 400 }
      );
    }

    const storage = getWeddingStorage();
    const createdMessage = await storage.addMessage(homeId, roomId, {
      authorType: 'member',
      authorUid: session.uid,
      text: parsed.data.text.trim(),
      lang: parsed.data.lang || session.member.preferredLanguage || 'en',
    });

    return NextResponse.json({
      success: true,
      message: createdMessage,
    });
  } catch (error: any) {
    console.error('Error posting message:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to post message' },
      { status: 500 }
    );
  }
}

