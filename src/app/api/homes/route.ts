import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getWeddingStorage } from '@/lib/storage';
import { getSession } from '@/lib/auth/session';

const CreateHomeSchema = z.object({
  coupleNames: z.string().min(1).max(100),
  date: z.string().optional(),
  city: z.string().optional(),
  eventType: z.enum(['wedding', 'birthday', 'community']).optional().default('wedding'),
  eventSubtype: z.string().max(100).optional(),
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
    const parsed = CreateHomeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid home creation payload' },
        { status: 400 }
      );
    }

    const { coupleNames, date, city, eventType, eventSubtype } = parsed.data;
    const storage = getWeddingStorage();

    const result = await storage.createHomeWithDetails({
      coupleNames,
      date,
      city,
      ownerUid: session.uid,
      ownerName: session.member.name || coupleNames,
      preferredLanguage: session.member.preferredLanguage || 'en',
      eventType,
      eventSubtype,
    });

    return NextResponse.json({
      success: true,
      home: result.home,
      member: result.member,
    });
  } catch (error: any) {
    console.error('Error creating home:', error);
    return NextResponse.json(
      { success: false, error: 'Server error creating home' },
      { status: 500 }
    );
  }
}

