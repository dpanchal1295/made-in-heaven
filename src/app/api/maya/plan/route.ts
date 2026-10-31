import { checkOrigin } from '@/lib/security/originCheck';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getWeddingStorage } from '@/lib/storage';
import { callMaya } from '@/lib/maya/callMaya';
import {
  MOCK_CATERING_BREAKDOWN,
  getMockPlanEnvelope,
} from '@/lib/maya/fixtures';
import { PlanPartSource } from '@/types/firestore';
import { getSession } from '@/lib/auth/session';

const PLAN_PART_SPEC: Record<string, { promptSummary: string; schemaDescription: string }> = {
  budget: {
    promptSummary: 'Compute an itemized wedding budget split across categories and functions.',
    schemaDescription: 'structured.data MUST be an array of objects: [{"category": string, "function": string, "percent": number, "estimated_low_inr": number, "estimated_high_inr": number, "notes": string}]. All percentages must sum to 100.',
  },
  timeline: {
    promptSummary: 'Generate milestone planning timeline countdown to the wedding date.',
    schemaDescription: 'structured.data MUST be an array of objects: [{"when": string, "task": string, "why_it_matters": string, "category": string}] ordered chronologically.',
  },
  checklist: {
    promptSummary: 'Generate vendor booking checklist with vendor types, timing, and questions to ask.',
    schemaDescription: 'structured.data MUST be an array of objects: [{"vendor_type": string, "book_by": string, "questions_to_ask": string[] or string, "estimated_range": string}]. Never use real business names.',
  },
  palette: {
    promptSummary: 'Curate a 4-color cultural wedding palette.',
    schemaDescription: 'structured.data MUST be an object: {"colors": [{"color_name": string, "hex": string, "used_for": string, "mood": string}], "why_it_fits": string}.',
  },
  decor: {
    promptSummary: 'Generate wedding decor concepts for primary wedding areas.',
    schemaDescription: 'structured.data MUST be an array of objects: [{"area": string, "idea": string, "diy_rent_or_buy": "DIY" | "Rent" | "Buy", "cost_tier": "₹" | "₹₹" | "₹₹₹", "saving_tip": string}].',
  },
  attire: {
    promptSummary: 'Generate traditional attire concepts for couple and family roles.',
    schemaDescription: 'structured.data MUST be an array of objects: [{"person_or_role": string, "idea": string, "buy_rent_or_custom": "Buy" | "Rent" | "Custom", "cost_tier": "₹" | "₹₹" | "₹₹₹", "lead_time": string, "tradition_note": string}].',
  },
};

const VALID_PARTS = ['budget', 'timeline', 'checklist', 'palette', 'decor', 'attire'] as const;
type ValidPlanPart = (typeof VALID_PARTS)[number];

const GeneratePlanBodySchema = z.object({
  part: z.string().optional(),
  toggleVendor: z.string().optional(),
  booked: z.boolean().optional(),
  action: z.string().optional(),
});

/**
 * GET /api/maya/plan
 * Returns current wedding plan, event profile, budget, and catering estimates.
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
    const homeId = session.homeId;
    const speaker = session.member;

    const [home, budget, plan] = await Promise.all([
      storage.getHome(homeId),
      storage.getBudget(homeId),
      storage.getPlan(homeId),
    ]);

    const safePlan = plan && !speaker.canSeeBudget ? { ...plan, budget: null } : plan;

    return NextResponse.json({
      success: true,
      home,
      profile: home.profile,
      budget: speaker.canSeeBudget ? budget : null,
      speaker,
      plan: safePlan,
      cateringBreakdown: speaker.canSeeBudget ? MOCK_CATERING_BREAKDOWN : [],
    });
  } catch (error) {
    console.error('Failed to load plan state:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load plan state' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/maya/plan
 * Generates plan parts (mock or live), toggles vendor checklist items, or clears the plan.
 */
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

    const storage = getWeddingStorage();
    const body = await req.json().catch(() => ({}));
    const parsed = GeneratePlanBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid plan request payload' },
        { status: 400 }
      );
    }

    const homeId = session.homeId;
    const speaker = session.member;
    const { part, toggleVendor, booked, action } = parsed.data;

    // 1. Action: Clear Plan - Only couple can clear plan
    if (action === 'clear') {
      if (speaker.permission !== 'couple') {
        return NextResponse.json(
          { success: false, error: 'Only the couple has permission to clear the wedding plan.' },
          { status: 403 }
        );
      }
      const clearedPlan = await storage.clearPlan(homeId);
      return NextResponse.json({
        success: true,
        plan: clearedPlan,
        message: 'Plan cleared successfully',
      });
    }

    // 2. Action: Toggle Checklist Item Booked status
    if (typeof toggleVendor === 'string' && typeof booked === 'boolean') {
      const updatedPlan = await storage.toggleChecklistItem(homeId, toggleVendor, booked);
      const safePlan = speaker.canSeeBudget ? updatedPlan : { ...updatedPlan, budget: null };
      return NextResponse.json({
        success: true,
        plan: safePlan,
      });
    }

    // 3. Action: Generate Budget Tab - Blocked if user cannot see budget
    if (part === 'budget' && !speaker.canSeeBudget) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to view or generate budget data.' },
        { status: 403 }
      );
    }

    // 4. Action: Generate Plan Part(s)
    if (!part || (part !== 'all' && !VALID_PARTS.includes(part as ValidPlanPart))) {
      return NextResponse.json(
        { success: false, error: 'Valid plan part name or action is required' },
        { status: 400 }
      );
    }

    const isMock = process.env.MAYA_MOCK === 'true';
    const source: PlanPartSource = isMock ? 'mock' : 'live';
    const partsToGenerate: ValidPlanPart[] = part === 'all' ? [...VALID_PARTS] : [part as ValidPlanPart];

    let latestPlan = await storage.getPlan(homeId);

    if (isMock) {
      for (const p of partsToGenerate) {
        const envelope = getMockPlanEnvelope(p);
        latestPlan = await storage.savePlanPart(homeId, p, envelope.structured.data, source);
      }

      const safePlan = speaker.canSeeBudget ? latestPlan : (latestPlan ? { ...latestPlan, budget: null } : null);
      return NextResponse.json({
        success: true,
        plan: safePlan,
        source: 'mock',
      });
    }

    // Live Generation using Gemini via callMaya with dynamic event profile & budget
    const [home, budget] = await Promise.all([
      storage.getHome(homeId),
      storage.getBudget(homeId),
    ]);

    const locationStr = home.profile?.city || 'Pune';
    const guestCountVal = home.profile?.guest_count?.planning_value || home.profile?.guest_count?.estimate || 300;
    const functionsStr = (home.profile?.functions && home.profile.functions.length > 0)
      ? home.profile.functions.join(', ')
      : 'Mehendi, Sangeet, Wedding, Reception';

    let budgetStr = 'Estimates standard for event profile';
    if (budget && budget.total) {
      budgetStr = `₹${(budget.total / 100000).toFixed(1)} Lakh`;
      if (budget.range) {
        budgetStr = `₹${(budget.range.low / 100000).toFixed(1)} Lakh to ₹${(budget.range.high / 100000).toFixed(1)} Lakh`;
      }
    }

    const eventType = home.profile?.eventType || 'wedding';
    const eventSubtype = home.profile?.eventSubtype || '';

    // Dynamic prompt summary customized for celebration types
    const getPartPromptSummary = (p: string) => {
      if (eventType === 'birthday') {
        if (p === 'budget') return 'Compute an itemized birthday celebration budget including morning puja, cake, party venue, catering, entertainment, and return gifts.';
        if (p === 'timeline') return 'Generate planning timeline countdown to the birthday celebration date.';
        if (p === 'checklist') return 'Generate vendor booking checklist covering cake designer, venue/puja officiant, photographer, music/entertainment, and return gifts.';
        if (p === 'palette') return 'Curate an elegant 4-color festive birthday celebration palette.';
        if (p === 'decor') return 'Generate birthday decor concepts (entrance welcome board, photo memory backdrop, cake table, lounge lighting).';
        if (p === 'attire') return 'Generate celebration attire concepts for the birthday celebrant, hosts, and family (morning puja and evening party).';
      }
      if (eventType === 'community') {
        if (p === 'budget') return `Compute an itemized community celebration budget (${eventSubtype || 'Festival/Society'}) covering ground/pandal setup, sound/orchestra, mahaprasad/food stalls, security, and municipal permits. Note any sponsorship contribution.`;
        if (p === 'timeline') return 'Generate milestone preparation timeline countdown to festival setup and event days.';
        if (p === 'checklist') return 'Generate vendor and regulatory checklist covering pandal contractor, sound system, police/fire/sound permits, first aid, generators, and security.';
        if (p === 'palette') return 'Curate a vibrant 4-color festival/community celebration palette.';
        if (p === 'decor') return 'Generate community event decor concepts (grand entrance arch, main stage/mandap, lighting, dining/prasad area).';
        if (p === 'attire') return 'Generate attire and identity concepts for participants and committee volunteers (traditional garba/kurta wear, committee sashes, volunteer badges).';
      }
      return PLAN_PART_SPEC[p].promptSummary;
    };

    // Execute plan generation sequentially (one after another) to avoid Gemini rate limits (429) on free tier
    for (const p of partsToGenerate) {
      let partData: any = null;
      let partSource: PlanPartSource = 'live';

      const spec = PLAN_PART_SPEC[p];
      const promptSummary = getPartPromptSummary(p);
      const promptInstruction = `Generate structured celebration plan part: "${p}" for a ${eventType} (${eventSubtype || 'Celebration'}).
Instructions: ${promptSummary}
Location: ${locationStr}.
Functions: ${functionsStr}.
Guests / Footfall: ${guestCountVal}.
Budget: ${budgetStr}.
STRICT OUTPUT REQUIREMENT: structured.type MUST be "${p}".
${spec.schemaDescription}
Do NOT wrap the array in an object key like { items: ... } or { ${p}: ... }. Return the exact JSON envelope.`;

      // Retry with backoff if rate-limited (429) or transient error
      let attempt = 0;
      let succeeded = false;

      while (attempt < 3 && !succeeded) {
        attempt++;
        try {
          const envelope = await callMaya({
            userMessage: promptInstruction,
            speaker: {
              name: speaker.name,
              relationship: speaker.relationship,
              permission: speaker.permission,
              preferred_language: speaker.preferredLanguage,
              can_see_budget: speaker.canSeeBudget,
            },
            mode: 'text',
            room: 'General',
            eventProfile: home.profile,
            budget: speaker.canSeeBudget ? budget : null,
            topic: `Generate ${p} plan`,
          });

          if (envelope.structured && envelope.structured.type === p && envelope.structured.data) {
            partData = envelope.structured.data;
            partSource = 'live';
            succeeded = true;
          } else {
            const isRateLimitReply = envelope.reply?.includes('high demand') || envelope.reply?.includes('catching her breath');
            console.warn(`[Plan Generator Live Attempt ${attempt}] Part "${p}": Response structured type mismatch or 429. Type received: "${envelope.structured?.type}" (RateLimit: ${isRateLimitReply})`);
            
            if (isRateLimitReply && attempt < 3) {
              // Rate limited by Gemini free tier RPM: wait 5s before retrying
              console.log(`[Plan Generator] Rate limited on part "${p}", waiting 5s before retry ${attempt + 1}...`);
              await new Promise((r) => setTimeout(r, 5000));
            } else if (attempt >= 3) {
              const fallbackEnvelope = getMockPlanEnvelope(p);
              partData = fallbackEnvelope.structured.data;
              partSource = 'mock';
            }
          }
        } catch (genErr: any) {
          console.error(`[Plan Generator Live Attempt ${attempt}] Part "${p}" failed: ${genErr?.message || genErr}`);
          if (attempt < 3) {
            await new Promise((r) => setTimeout(r, 4000));
          } else {
            const fallbackEnvelope = getMockPlanEnvelope(p);
            partData = fallbackEnvelope.structured.data;
            partSource = 'mock';
          }
        }
      }

      latestPlan = await storage.savePlanPart(homeId, p, partData, partSource);
    }

    const safePlan = speaker.canSeeBudget ? latestPlan : (latestPlan ? { ...latestPlan, budget: null } : null);
    return NextResponse.json({
      success: true,
      plan: safePlan,
      source: 'live',
    });
  } catch (error) {
    console.error('Error generating wedding plan part:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Unable to generate plan part at this time. Please try again.',
      },
      { status: 500 }
    );
  }
}
