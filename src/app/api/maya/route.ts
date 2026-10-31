import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getWeddingStorage } from '@/lib/storage';
import { callMaya } from '@/lib/maya/callMaya';
import { getOnboardingStatus, parseRangeAndPlanningValue } from '@/lib/utils/format';
import { NeedsConfirmation } from '@/lib/maya/schemas';
import { PlanPartSource } from '@/types/firestore';
import { getSession } from '@/lib/auth/session';
import { checkRateLimit } from '@/lib/security/rateLimit';

const DEFAULT_ROOM_ID = 'onboarding';

const PLAN_PARTS = ['budget', 'timeline', 'checklist', 'palette', 'decor', 'attire'] as const;
type PlanPart = (typeof PLAN_PARTS)[number];

function isPlanPart(type: unknown): type is PlanPart {
  return typeof type === 'string' && (PLAN_PARTS as readonly string[]).includes(type as PlanPart);
}

const MayaChatQuerySchema = z.object({
  homeId: z.string().optional(),
  roomId: z.string().optional(),
});

const MayaChatBodySchema = z.object({
  message: z.string().min(1).max(2000),
  roomId: z.string().optional().default(DEFAULT_ROOM_ID),
  mode: z.enum(['text', 'voice']).optional().default('text'),
});

/**
 * GET /api/maya
 * Returns the current chat history, profile, budget, speaker context, and onboarding status.
 * If message history is empty, triggers Maya's initial warm onboarding greeting.
 */
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
    const { searchParams } = req.nextUrl;
    const query = MayaChatQuerySchema.parse({
      homeId: searchParams.get('homeId') || undefined,
      roomId: searchParams.get('roomId') || undefined,
    });

    const homeId = query.homeId || session.homeId;
    const roomId = query.roomId || DEFAULT_ROOM_ID;
    const speaker = session.member;

    const [home, budget, messages, pendingConfirmations] = await Promise.all([
      storage.getHome(homeId),
      storage.getBudget(homeId),
      storage.getRecentMessages(homeId, roomId, 50),
      storage.getPendingConfirmations(homeId),
    ]);

    // If room is empty, create initial welcoming Maya message
    if (messages.length === 0) {
      const initialEnvelope = {
        reply: "Namaste! I'm Maya, your personal wedding manager at Made in Heaven. I am so delighted to celebrate your love and help plan this magical journey with you!\n\nLet's begin by building your wedding foundation together, one detail at a time. **When are you thinking of having the wedding?** (Or what month / season are you picturing?)",
        spoken_reply: "Namaste! I'm Maya, your wedding manager. When are you thinking of getting married?",
        quick_replies: [
          'Late 2026 (Nov - Dec)',
          'Early 2027 (Jan - Feb)',
          'Spring 2027 (Mar - Apr)',
          'Winter 2027',
        ],
        profile_updates: [],
        needs_confirmation: [],
        structured: { type: 'none', data: null },
      };

      const initialMessage = await storage.addMessage(homeId, roomId, {
        authorType: 'maya',
        authorUid: 'maya-ai',
        text: initialEnvelope.reply,
        lang: speaker.preferredLanguage || 'en',
        structured: initialEnvelope,
      });

      messages.push(initialMessage);
    }

    const onboardingStatus = getOnboardingStatus(home.profile, budget);

    return NextResponse.json({
      success: true,
      home,
      profile: home.profile,
      budget: speaker.canSeeBudget ? budget : null,
      speaker,
      messages,
      pendingConfirmations: speaker.permission === 'couple' ? pendingConfirmations : [],
      onboardingStatus,
    });
  } catch (error: any) {
    console.error('Failed to load Maya chat state:', error);
    const fallbackStatus = getOnboardingStatus(null, null);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load chat state',
        onboardingStatus: fallbackStatus,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/maya
 * Executes a Maya chat turn following Section 5 of the build brief.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: No active session' },
        { status: 401 }
      );
    }

    // Rate limit per user identifier
    const rateCheck = checkRateLimit(session.uid, 30, 60 * 1000);
    if (!rateCheck.allowed) {
      const fallbackStatus = getOnboardingStatus(null, null);
      return NextResponse.json(
        {
          success: false,
          error: 'Maya is taking a short break, please try again in a minute.',
          onboardingStatus: fallbackStatus,
        },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const parseResult = MayaChatBodySchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body or message exceeds character limit' },
        { status: 400 }
      );
    }

    const { message, roomId, mode } = parseResult.data;
    const storage = getWeddingStorage();
    const homeId = session.homeId;
    const speaker = session.member;

    // 1. Load context: profile, budget, recent messages
    const [home, budget, recentMessages] = await Promise.all([
      storage.getHome(homeId),
      storage.getBudget(homeId),
      storage.getRecentMessages(homeId, roomId, 20),
    ]);

    // 2. Save user message to storage
    await storage.addMessage(homeId, roomId, {
      authorType: 'member',
      authorUid: speaker.uid,
      text: message.trim(),
      lang: speaker.preferredLanguage || 'en',
    });

    // 3. Compute onboarding progress & inject targeted instructions into context
    const currentOnboarding = getOnboardingStatus(home.profile, budget);
    const mustAskCommunicationStyle = Boolean(
      currentOnboarding.isCoreComplete && !currentOnboarding.fields.communicationStyle
    );

    const userGuestRange = parseRangeAndPlanningValue(message.trim(), false);
    const userBudgetRange = parseRangeAndPlanningValue(message.trim(), true);

    let onboardingGuidance = '';
    if (mustAskCommunicationStyle) {
      onboardingGuidance = `MUST_ASK_COMMUNICATION_STYLE is TRUE.
All 6 core fields (date, city, guest count, budget, culture, vibe) are collected/saved and communication_style is empty!
Maya's very next message MUST ask the couple this exact question to learn how they prefer to hear about problems:
"When something doesn't fit the plan, do you prefer it gentle, balanced, or straight to the point?"
Set quick_replies strictly to: ["Gentle", "Balanced", "Straight to the point"].
Do NOT offer any other options or next steps yet.
When they answer, save it to "communication_style.honesty_preference".`;
    } else if (!currentOnboarding.isCoreComplete) {
      onboardingGuidance = `ONBOARDING IN PROGRESS:
The couple has completed ${currentOnboarding.completedCount}/6 core wedding details.
Missing required fields: ${currentOnboarding.missingFields.join(', ')}.
Core habit: Ask ONE question at a time for the next missing field, with 3 to 4 quick example answers.`;
    }

    if (userGuestRange || userBudgetRange) {
      const parts: string[] = [];
      if (userGuestRange) parts.push(`guests: ${userGuestRange.low}-${userGuestRange.high} (midpoint: ${userGuestRange.planning_value})`);
      if (userBudgetRange) parts.push(`budget: ₹${userBudgetRange.low}-₹${userBudgetRange.high} (midpoint: ₹${userBudgetRange.planning_value})`);
      onboardingGuidance += `\n\nRANGE INSTRUCTION: The user provided a range (${parts.join(', ')}).
Store the range as given (low and high) and the planning value (midpoint).
Maya MUST explicitly say which single number she will plan with and must never silently turn a range into one number.`;
    }

    // 4. Call Maya AI (server-only call with Gemini SDK, system prompt Part A + C, Zod validation, retry)
    const envelope = await callMaya({
      userMessage: message.trim(),
      speaker: {
        name: speaker.name,
        relationship: speaker.relationship,
        permission: speaker.permission,
        preferred_language: speaker.preferredLanguage,
        can_see_budget: speaker.canSeeBudget,
      },
      mode: mode === 'voice' ? 'voice' : 'text',
      room: roomId,
      eventProfile: home.profile,
      budget: speaker.canSeeBudget ? budget : null,
      recentMessages,
      onboardingGuidance,
    });

    // 5. Apply allowed profile updates
    let updatedProfile = home.profile;
    let updatedBudget = budget;
    if (envelope.profile_updates && envelope.profile_updates.length > 0) {
      const updateResult = await storage.applyProfileUpdates(
        homeId,
        envelope.profile_updates,
        speaker.permission
      );
      updatedProfile = updateResult.profile;
      updatedBudget = updateResult.budget;
    }

    // 6. Handle needs_confirmation items
    const savedConfirmations: NeedsConfirmation[] = [];
    if (envelope.needs_confirmation && envelope.needs_confirmation.length > 0) {
      for (const item of envelope.needs_confirmation) {
        const saved = await storage.savePendingConfirmation(homeId, {
          homeId,
          path: item.path,
          value: item.value,
          question: item.question,
        });
        savedConfirmations.push({
          id: saved.id,
          path: saved.path,
          value: saved.value,
          question: saved.question,
        });
      }
    }

    let savedPlanPart: string | null = null;
    let updatedPlan = await storage.getPlan(homeId);
    if (envelope.structured && isPlanPart(envelope.structured.type) && envelope.structured.data) {
      const part = envelope.structured.type as PlanPart;
      if (part !== 'budget' || speaker.canSeeBudget) {
        const source: PlanPartSource = process.env.MAYA_MOCK === 'true' ? 'mock' : 'live';
        updatedPlan = await storage.savePlanPart(homeId, part, envelope.structured.data, source);
        savedPlanPart = part;
      }
    }

    // 8. Save Maya's reply to message history
    const mayaMessage = await storage.addMessage(homeId, roomId, {
      authorType: 'maya',
      authorUid: 'maya-ai',
      text: envelope.reply,
      lang: speaker.preferredLanguage || 'en',
      structured: envelope,
      planPartSaved: savedPlanPart,
    });

    const finalOnboarding = getOnboardingStatus(updatedProfile, updatedBudget);
    const safePlan = speaker.canSeeBudget ? updatedPlan : (updatedPlan ? { ...updatedPlan, budget: null } : null);

    return NextResponse.json({
      success: true,
      message: mayaMessage,
      reply: envelope.reply,
      spoken_reply: envelope.spoken_reply,
      quick_replies: envelope.quick_replies,
      structured: envelope.structured,
      planPartSaved: savedPlanPart,
      envelope: {
        ...envelope,
        needs_confirmation: savedConfirmations,
      },
      profile: updatedProfile,
      budget: speaker.canSeeBudget ? updatedBudget : null,
      plan: safePlan,
      onboardingStatus: finalOnboarding,
    });
  } catch (error: any) {
    console.error('Error executing Maya chat turn:', error);
    const fallbackStatus = getOnboardingStatus(null, null);
    const isRateLimit = error?.status === 429 || error?.message?.includes?.('429');
    return NextResponse.json(
      {
        success: false,
        error: isRateLimit
          ? 'Maya is taking a short break, please try again in a minute.'
          : 'Maya is temporarily resting. Please try again in a few moments.',
        onboardingStatus: fallbackStatus,
      },
      { status: isRateLimit ? 429 : 500 }
    );
  }
}
