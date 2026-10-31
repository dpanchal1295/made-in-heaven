import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  BudgetDataSchema,
  TimelineDataSchema,
  ChecklistDataSchema,
  PaletteDataSchema,
  DecorDataSchema,
  AttireDataSchema,
  MayaResponseEnvelopeSchema,
} from './schemas';
import {
  MOCK_BUDGET_DATA,
  MOCK_CHECKLIST_DATA,
  MOCK_PALETTE_DATA,
  MOCK_DECOR_DATA,
  MOCK_ATTIRE_DATA,
  MOCK_CATERING_BREAKDOWN,
  generateTimelineFixture,
  getMockPlanEnvelope,
  DEMO_COUPLE_PROFILE,
  DEMO_PRIVATE_BUDGET,
  extractHttpStatusCode,
} from './fixtures';

describe('Workstream 2: Mock Fixtures and Schema Conformance', () => {
  it('strictly validates Pune budget fixture conforming to BudgetDataSchema and matches stated range', () => {
    // 1. Conforms to Zod
    const parseResult = BudgetDataSchema.safeParse(MOCK_BUDGET_DATA);
    assert.strictEqual(parseResult.success, true, 'MOCK_BUDGET_DATA must satisfy BudgetDataSchema');

    // 2. Percentages sum to 100%
    const sumPercent = MOCK_BUDGET_DATA.reduce((acc, item) => acc + item.percent, 0);
    assert.strictEqual(sumPercent, 100, 'Budget category percentages must sum to exactly 100%');

    // 3. Category low/high estimates sum matches stated total range: ₹8,00,000 to ₹15,00,000
    const sumLow = MOCK_BUDGET_DATA.reduce((acc, item) => acc + item.estimated_low_inr, 0);
    const sumHigh = MOCK_BUDGET_DATA.reduce((acc, item) => acc + item.estimated_high_inr, 0);
    assert.strictEqual(sumLow, 800000, 'Sum of low category estimates must equal ₹8,00,000');
    assert.strictEqual(sumHigh, 1500000, 'Sum of high category estimates must equal ₹15,00,000');

    // 4. City is Pune only
    assert.strictEqual(DEMO_COUPLE_PROFILE.city, 'Pune');
    assert.strictEqual(DEMO_COUPLE_PROFILE.guest_count.estimate, 300);
  });

  it('validates per-function plate ranges for Pune catering breakdown', () => {
    assert.strictEqual(MOCK_CATERING_BREAKDOWN.length, 4, 'Must include 4 functions');

    const fnNames = MOCK_CATERING_BREAKDOWN.map((f) => f.function_name);
    assert.ok(fnNames.includes('Mehendi'));
    assert.ok(fnNames.includes('Sangeet'));
    assert.ok(fnNames.includes('Wedding (Pheras)'));
    assert.ok(fnNames.includes('Reception'));

    // Verify per plate calculations
    for (const item of MOCK_CATERING_BREAKDOWN) {
      assert.strictEqual(
        item.total_low_inr,
        item.per_plate_low_inr * item.guests,
        `${item.function_name} low total must equal per_plate_low * guests`
      );
      assert.strictEqual(
        item.total_high_inr,
        item.per_plate_high_inr * item.guests,
        `${item.function_name} high total must equal per_plate_high * guests`
      );
    }
  });

  it('validates dynamic timeline generation starting from today and compressing if < 12 weeks', () => {
    // Case 1: 14 weeks before
    const timeline14 = generateTimelineFixture('2026-09-01', '2026-12-18');
    assert.strictEqual(TimelineDataSchema.safeParse(timeline14).success, true);
    assert.ok(timeline14.some((t) => t.when.includes('weeks before')));

    // Case 2: 7 weeks before (e.g. late October 2026 to Dec 18 2026)
    const timelineCompressed = generateTimelineFixture('2026-10-24', '2026-12-18');
    assert.strictEqual(TimelineDataSchema.safeParse(timelineCompressed).success, true);

    // Compressed timeline must mark overdue / urgent tasks
    const hasUrgent = timelineCompressed.some(
      (t) => t.task.includes('[URGENT]') || t.when.toLowerCase().includes('urgent') || t.when.toLowerCase().includes('immediate')
    );
    assert.strictEqual(hasUrgent, true, 'Timeline with <12 weeks remaining must mark urgent items');
  });

  it('validates checklist, palette, decor, and attire fixtures', () => {
    // Checklist: vendor TYPES only, no real business names
    const checklistRes = ChecklistDataSchema.safeParse(MOCK_CHECKLIST_DATA);
    assert.strictEqual(checklistRes.success, true);
    for (const item of MOCK_CHECKLIST_DATA) {
      assert.ok(typeof item.vendor_type === 'string' && item.vendor_type.length > 0);
      assert.ok(typeof item.book_by === 'string' && item.book_by.length > 0);
      assert.ok(typeof item.estimated_range === 'string' && item.estimated_range.includes('₹'));
    }

    // Palette: 4 colors
    const paletteRes = PaletteDataSchema.safeParse(MOCK_PALETTE_DATA);
    assert.strictEqual(paletteRes.success, true);
    assert.strictEqual(MOCK_PALETTE_DATA.colors.length, 4);
    for (const c of MOCK_PALETTE_DATA.colors) {
      assert.ok(/^#[0-9A-Fa-f]{6}$/.test(c.hex));
    }

    // Decor: 5 areas
    const decorRes = DecorDataSchema.safeParse(MOCK_DECOR_DATA);
    assert.strictEqual(decorRes.success, true);
    assert.strictEqual(MOCK_DECOR_DATA.length, 5);

    // Attire: 4 roles
    const attireRes = AttireDataSchema.safeParse(MOCK_ATTIRE_DATA);
    assert.strictEqual(attireRes.success, true);
    assert.strictEqual(MOCK_ATTIRE_DATA.length, 4);
  });

  it('validates canned plan envelopes against MayaResponseEnvelopeSchema', () => {
    const parts = ['budget', 'timeline', 'checklist', 'palette', 'decor', 'attire'] as const;
    for (const part of parts) {
      const envelope = getMockPlanEnvelope(part);
      const res = MayaResponseEnvelopeSchema.safeParse(envelope);
      assert.strictEqual(res.success, true, `Envelope for ${part} must pass MayaResponseEnvelopeSchema`);
      assert.strictEqual(envelope.structured.type, part);
    }
  });

  it('extracts HTTP status codes correctly for error handling', () => {
    assert.strictEqual(extractHttpStatusCode({ status: 429 }), 429);
    assert.strictEqual(extractHttpStatusCode({ statusCode: 503 }), 503);
    assert.strictEqual(extractHttpStatusCode({ response: { status: 401 } }), 401);
    assert.strictEqual(extractHttpStatusCode(new Error('Resource has been exhausted (e.g. check quota) 429')), 429);
    assert.strictEqual(extractHttpStatusCode(new Error('RESOURCE_EXHAUSTED')), 429);
    assert.strictEqual(extractHttpStatusCode(new Error('UNAVAILABLE')), 503);
    assert.strictEqual(extractHttpStatusCode(new Error('UNAUTHENTICATED')), 401);
    assert.strictEqual(extractHttpStatusCode(new Error('PERMISSION_DENIED')), 403);
    assert.strictEqual(extractHttpStatusCode(new Error('NOT_FOUND')), 404);
  });

  it('tests storage plan persistence, checklist ticking, and plan clearing', async () => {
    const { getWeddingStorage } = await import('../storage');
    const storage = getWeddingStorage();
    const testHomeId = 'test-home-plan-' + Date.now();

    // 1. Initially plan is null
    const initialPlan = await storage.getPlan(testHomeId);
    assert.strictEqual(initialPlan, null);

    // 2. Save plan part with source: 'mock'
    const updatedWithBudget = await storage.savePlanPart(
      testHomeId,
      'budget',
      MOCK_BUDGET_DATA,
      'mock'
    );
    assert.ok(updatedWithBudget.budget);
    assert.strictEqual(updatedWithBudget.budget.source, 'mock');
    assert.deepStrictEqual(updatedWithBudget.budget.data, MOCK_BUDGET_DATA);

    // 3. Toggle checklist item
    const withChecklistTick = await storage.toggleChecklistItem(
      testHomeId,
      'Heritage Garden & Banquet Venue',
      true
    );
    assert.strictEqual(
      withChecklistTick.bookedVendors?.['Heritage Garden & Banquet Venue'],
      true
    );

    // Toggle off
    const withChecklistUntick = await storage.toggleChecklistItem(
      testHomeId,
      'Heritage Garden & Banquet Venue',
      false
    );
    assert.strictEqual(
      withChecklistUntick.bookedVendors?.['Heritage Garden & Banquet Venue'],
      false
    );

    // 4. Clear plan resets parts and ticks
    const cleared = await storage.clearPlan(testHomeId);
    assert.strictEqual(cleared.budget, null);
    assert.strictEqual(cleared.timeline, null);
    assert.strictEqual(cleared.checklist, null);
    assert.deepStrictEqual(cleared.bookedVendors, {});
  });
});
