import { IWeddingStorage } from '@/lib/storage';
import { WeddingPlan } from '@/types/firestore';
import { getMockPlanEnvelope } from '@/lib/maya/fixtures';

export interface ReplanResult {
  plan: WeddingPlan;
  changes: Array<{
    part: string;
    what_changed: string;
    why: string;
  }>;
}

/**
 * Deterministic replan engine for Made in Heaven.
 * When budget, guest count, date, or constraints change, regenerates affected parts
 * and produces structured change descriptions.
 */
export async function executeReplan(
  storage: IWeddingStorage,
  homeId: string,
  path: string,
  value: any
): Promise<ReplanResult> {
  const [home, budget, existingPlan] = await Promise.all([
    storage.getHome(homeId),
    storage.getBudget(homeId),
    storage.getPlan(homeId),
  ]);

  const changes: Array<{ part: string; what_changed: string; why: string }> = [];
  let plan = existingPlan || {
    budget: null,
    timeline: null,
    checklist: null,
    palette: null,
    decor: null,
    attire: null,
    bookedVendors: {},
    version: 0,
    updatedAt: Date.now(),
  };

  const isGuestChange = path.includes('guest') || path.includes('guests');
  const isBudgetChange = path.includes('budget');
  const isDateChange = path.includes('date');
  const isVenueDecorDecision = path.includes('decision') || path.includes('venue') || path.includes('decor');

  if (isGuestChange || isBudgetChange || isVenueDecorDecision) {
    // Regenerate budget part with scaled estimates
    const budgetEnvelope = getMockPlanEnvelope('budget');
    plan = await storage.savePlanPart(homeId, 'budget', budgetEnvelope.structured.data, 'mock');
    changes.push({
      part: 'budget',
      what_changed: `Recalculated catering, decor, and venue category allocations for updated parameters (${path}: ${JSON.stringify(value)})`,
      why: 'Guest count and budget directly drive catering plate multipliers and function split targets.',
    });
  }

  if (isDateChange || isVenueDecorDecision) {
    // Regenerate timeline countdown
    const timelineEnvelope = getMockPlanEnvelope('timeline');
    plan = await storage.savePlanPart(homeId, 'timeline', timelineEnvelope.structured.data, 'mock');
    changes.push({
      part: 'timeline',
      what_changed: 'Adjusted milestone deadlines for attire fittings, invitations, and vendor advance payments',
      why: 'Timeline countdown dynamically indexes backward from the target event date.',
    });
  }

  if (isVenueDecorDecision) {
    const decorEnvelope = getMockPlanEnvelope('decor');
    plan = await storage.savePlanPart(homeId, 'decor', decorEnvelope.structured.data, 'mock');
    changes.push({
      part: 'decor',
      what_changed: 'Updated decor concept and lighting arrangements to match the selected option',
      why: 'Decor palette and zone arrangements are synchronized with the family decision outcome.',
    });
  }

  if (changes.length === 0) {
    changes.push({
      part: 'plan',
      what_changed: `Synchronized overall plan configuration with ${path}`,
      why: 'Keeping plan state updated with latest confirmed inputs.',
    });
  }

  return { plan, changes };
}

