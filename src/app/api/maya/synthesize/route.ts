import { checkOrigin } from '@/lib/security/originCheck';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getWeddingStorage } from '@/lib/storage';
import { getSession } from '@/lib/auth/session';
import { checkRateLimit } from '@/lib/security/rateLimit';
import { callMaya } from '@/lib/maya/callMaya';

const SynthesizeBodySchema = z.object({
  roomId: z.string().min(1),
});

import { DecisionBriefDataSchema as DecisionBriefSchema } from '@/lib/maya/schemas';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
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

    // Rate limit
    const rateCheck = checkRateLimit(session.uid, 20, 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded. Please wait a few moments.' },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const parsed = SynthesizeBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Valid roomId is required' },
        { status: 400 }
      );
    }

    const { roomId } = parsed.data;
    const storage = getWeddingStorage();

    const [home, budget, ideas, members] = await Promise.all([
      storage.getHome(session.homeId),
      storage.getBudget(session.homeId),
      storage.getIdeas(session.homeId, roomId),
      storage.getMembers(session.homeId),
    ]);

    const canSeeBudget = session.member.canSeeBudget;
    const roomTopic = roomId.charAt(0).toUpperCase() + roomId.slice(1);

    // Build member ideas mapping from real room ideas
    const memberIdeas = ideas.map((idea) => {
      const author = members.find((m) => m.uid === idea.authorUid);
      return {
        member: author?.name || idea.authorName || 'Family Member',
        idea: idea.text,
      };
    });

    const isMock = process.env.MAYA_MOCK === 'true';
    let synthesizedBriefData: any = null;
    let briefSource: 'live' | 'mock' = 'live';

    if (!isMock && ideas.length > 0) {
      const contributorNames = Array.from(new Set(memberIdeas.map((m) => m.member)));
      const ideasFormatted = memberIdeas
        .map((m) => `- ${m.member}: "${m.idea}"`)
        .join('\n');

      const synthesizePrompt = `You are Maya conducting Group Synthesis for the "${roomTopic}" room.
EVENT_PROFILE: ${JSON.stringify(home.profile || {})}
LOCKED_CONSTRAINTS: ${(home.profile?.locked_constraints || []).join('; ')}
TOPIC: ${roomTopic}
REAL CONTRIBUTED IDEAS IN THIS ROOM:
${ideasFormatted}

CONTRIBUTING MEMBERS IN THIS ROOM:
${contributorNames.join(', ')}

MANDATORY RULES:
1. Every contributing member (${contributorNames.join(', ')}) must be listed in "member_ideas".
2. You must formulate 2 genuinely distinct options (Option A and Option B) specifically for ${roomTopic}.
3. In "who_gets_what", you may ONLY name members from the contributing list [${contributorNames.join(', ')}]. DO NOT name members who contributed no ideas in this room.
4. Option A and Option B must be distinct approaches (e.g. Traditional Heritage vs Contemporary/Modern).
5. The recommendation must be specifically about ${roomTopic} and explain why Option A or B is recommended.
6. structured.type MUST be "decision_brief".`;

      // Live synthesis call with retry
      for (let attempt = 1; attempt <= 2 && !synthesizedBriefData; attempt++) {
        try {
          const liveEnvelope = await callMaya({
            userMessage: synthesizePrompt,
            speaker: {
              name: session.member.name,
              relationship: session.member.relationship,
              permission: session.member.permission,
              preferred_language: session.member.preferredLanguage,
              can_see_budget: canSeeBudget,
            },
            mode: 'text',
            room: roomTopic,
            eventProfile: home.profile,
            budget: canSeeBudget ? budget : null,
            topic: `Group Synthesis for ${roomTopic}`,
            groupSynthesis: true,
          });

          if (liveEnvelope.structured?.type === 'decision_brief' && liveEnvelope.structured?.data) {
            const rawBrief = liveEnvelope.structured.data;
            // Validate: only contributing members named in who_gets_what and options differ
            const validContributors = new Set(contributorNames);
            const allAssignedMembers = (rawBrief.options || []).flatMap((o: any) =>
              (o.who_gets_what || []).map((w: any) => w.member)
            );
            const hasInvalidMember = allAssignedMembers.some((m: string) => !validContributors.has(m));

            const optNames = (rawBrief.options || []).map((o: any) => (o.name || '').toLowerCase());
            const optIncludes = (rawBrief.options || []).map((o: any) => (o.what_it_includes || '').toLowerCase());
            const optionsTooSimilar = optNames.length >= 2 && (optNames[0] === optNames[1] || optIncludes[0] === optIncludes[1]);

            if (!hasInvalidMember && !optionsTooSimilar && (rawBrief.options || []).length >= 2) {
              synthesizedBriefData = rawBrief;
              briefSource = 'live';
            } else {
              console.warn(`[Synthesize Live Attempt ${attempt}] Validation warning: invalid member names or options too similar. Retrying...`);
            }
          }
        } catch (err: any) {
          console.error(`[Synthesize Live Attempt ${attempt}] Error:`, err?.message || err);
        }
      }
    }

    // Fallback if live call failed, mock mode is active, or room has no ideas
    if (!synthesizedBriefData) {
      briefSource = 'mock';
      const optionAIncludes =
        ideas.length > 0
          ? `Combines: ${ideas.slice(0, 2).map((i) => i.text).join('; ')}`
          : 'Open courtyard celebration with heritage styling';

      const optionBIncludes =
        ideas.length > 1
          ? `Alternative blend: ${ideas.slice(1, 3).map((i) => i.text).join('; ')}`
          : 'Contemporary hall celebration with custom acoustic sound setup';

      synthesizedBriefData = {
        topic: `${roomTopic} Selection for ${home.name}`,
        member_ideas: memberIdeas.length > 0 ? memberIdeas : [
          { member: session.member.name, idea: `Curate custom options for ${roomTopic}` }
        ],
        common_ground: [
          'Desire for an authentic cultural celebration honoring family traditions',
          'Emphasis on comfortable festive ambiance for all guests',
        ],
        conflicts: memberIdeas.length > 1 ? [
          {
            issue: 'Heritage styling vs contemporary modern accents',
            sides: [
              { member: memberIdeas[0]?.member || 'Couple', position: 'Prefers classic cultural ambiance' },
              { member: memberIdeas[1]?.member || 'Family', position: 'Prefers contemporary festive aesthetic' },
            ],
          },
        ] : [],
        options: [
          {
            id: 'A',
            name: `Option A: Heritage Fusion (${roomTopic})`,
            what_it_includes: optionAIncludes,
            who_gets_what: memberIdeas.slice(0, 2).map((m) => ({
              member: m.member,
              gets: m.idea,
            })),
            cost_tier: '₹₹',
            fits_locked_constraints: true,
            fits_budget: true,
          },
          {
            id: 'B',
            name: `Option B: Contemporary Blend (${roomTopic})`,
            what_it_includes: optionBIncludes,
            who_gets_what: memberIdeas.slice(1, 3).map((m) => ({
              member: m.member,
              gets: m.idea,
            })),
            cost_tier: '₹₹₹',
            fits_locked_constraints: true,
            fits_budget: true,
          },
        ],
        recommendation: {
          option_id: 'A',
          why: `Option A seamlessly balances the contributed ideas for ${roomTopic} while honoring the couple's overall aesthetic and constraints.`,
        },
      };
    }

    const decisionBriefData = {
      ...synthesizedBriefData,
      source: briefSource,
    };

    // Redact budget information if caller cannot see budget
    const safeOptions = decisionBriefData.options.map((opt: any) => {
      if (!canSeeBudget) {
        const { fits_budget, ...rest } = opt;
        return {
          ...rest,
          fits_budget: true, // Internal default for schema validation
        };
      }
      return opt;
    });

    const sanitizedBriefData = {
      ...decisionBriefData,
      options: safeOptions,
    };

    // Validate structured brief with schema
    const validatedBrief = DecisionBriefSchema.parse(sanitizedBriefData);

    // If caller cannot see budget, strip fits_budget from output response JSON
    const finalBrief = canSeeBudget
      ? validatedBrief
      : {
          ...validatedBrief,
          options: validatedBrief.options.map(({ fits_budget, ...rest }) => rest),
        };

    const envelope = {
      reply: `I have carefully reviewed everyone's wonderful ideas for the **${roomTopic}**! Here is a synthesis showing common ground, differing preferences, and 2 balanced options for the family to vote on.`,
      spoken_reply: `I have synthesized the family ideas for ${roomTopic}. Two options are ready for your vote.`,
      quick_replies: ['Vote on Option A', 'Vote on Option B', 'Ask couple to decide'],
      profile_updates: [],
      needs_confirmation: [],
      structured: {
        type: 'decision_brief',
        data: finalBrief,
      },
    };

    return NextResponse.json({
      success: true,
      envelope,
      brief: finalBrief,
    });
  } catch (error: any) {
    console.error('Error in /api/maya/synthesize:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to synthesize decision brief' },
      { status: 500 }
    );
  }
}

