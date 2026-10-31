import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  StructuredDataSchema,
  MayaResponseEnvelopeSchema,
  ProfileUpdateSchema,
} from './schemas';
import { parseRangeAndPlanningValue } from '../utils/format';

describe('StructuredDataSchema Validation', () => {
  it('passes for a valid checklist', () => {
    const validChecklist = {
      type: 'checklist',
      data: [
        {
          vendor_type: 'Photographer',
          book_by: '6 months before',
          questions_to_ask: [
            'Do you provide raw footage?',
            'What is the turnaround time for the album?',
          ],
          estimated_range: '₹1.5 Lakh – ₹3 Lakh',
        },
        {
          vendor_type: 'Venue',
          book_by: '9-12 months before',
          questions_to_ask: 'What is the deposit and cancellation policy?',
          estimated_range: '₹15 Lakh – ₹25 Lakh',
        },
      ],
    };

    const result = StructuredDataSchema.safeParse(validChecklist);
    assert.strictEqual(result.success, true);
  });

  it('fails for a checklist missing questions_to_ask', () => {
    const invalidChecklist = {
      type: 'checklist',
      data: [
        {
          vendor_type: 'Photographer',
          book_by: '6 months before',
          // questions_to_ask is deliberately omitted
          estimated_range: '₹1.5 Lakh – ₹3 Lakh',
        },
      ],
    };

    const result = StructuredDataSchema.safeParse(invalidChecklist);
    assert.strictEqual(result.success, false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      assert.ok(
        paths.some((p) => p.includes('questions_to_ask')),
        `Expected error on questions_to_ask but got paths: ${paths.join(', ')}`
      );
    }
  });

  it('passes for an unknown type as a generic payload', () => {
    const unknownPayload = {
      type: 'vendor_comparison_matrix',
      data: {
        title: 'Vendor Comparison',
        columns: ['Vendor', 'Rating', 'Price Tier'],
        rows: [
          ['Royal Palace Catering', '4.9', '₹₹₹'],
          ['Heritage Banquets', '4.7', '₹₹'],
        ],
      },
    };

    const result = StructuredDataSchema.safeParse(unknownPayload);
    assert.strictEqual(result.success, true);
    if (result.success) {
      assert.strictEqual(result.data.type, 'vendor_comparison_matrix');
      assert.deepStrictEqual(result.data.data, unknownPayload.data);
    }
  });

  it('passes for type none with null data', () => {
    const nonePayload = {
      type: 'none',
      data: null,
    };
    const result = StructuredDataSchema.safeParse(nonePayload);
    assert.strictEqual(result.success, true);
  });

  it('fails when a known type fails validation inside MayaResponseEnvelopeSchema', () => {
    const invalidEnvelope = {
      reply: 'Here is your checklist.',
      quick_replies: ['Looks good'],
      profile_updates: [],
      needs_confirmation: [],
      structured: {
        type: 'checklist',
        data: [
          {
            vendor_type: 'Decor',
            book_by: '3 months',
            // questions_to_ask missing
            estimated_range: '₹5L',
          },
        ],
      },
    };

    const result = MayaResponseEnvelopeSchema.safeParse(invalidEnvelope);
    assert.strictEqual(result.success, false);
  });

  it('passes when an unknown type is used inside MayaResponseEnvelopeSchema', () => {
    const genericEnvelope = {
      reply: 'Here is custom structured data.',
      quick_replies: ['Got it'],
      profile_updates: [],
      needs_confirmation: [],
      structured: {
        type: 'custom_guest_summary',
        data: {
          total_confirmed: 350,
          pending: 50,
        },
      },
    };

    const result = MayaResponseEnvelopeSchema.safeParse(genericEnvelope);
    assert.strictEqual(result.success, true);
  });
});

describe('Guest-Range Reply Schema Validation', () => {
  it('passes validation for exact guest-range reply shape with { low, high } and planning_value', () => {
    const guestRangeEnvelope = {
      reply: "Saved! That's going to be a lively celebration. I'll plan with 650 guests for now—tell me if that feels off.\n\nWhat overall budget range do you have in mind for the wedding?",
      spoken_reply: null,
      quick_replies: [
        '₹30 – ₹50 Lakh',
        '₹50 – ₹75 Lakh',
        '₹75 Lakh – ₹1 Crore',
        'Something else',
      ],
      profile_updates: [
        {
          path: 'guest_count.range',
          action: 'set',
          value: {
            low: 500,
            high: 800,
          },
          reason: 'Couple provided guest count range of 500 to 800',
        },
        {
          path: 'guest_count.planning_value',
          action: 'set',
          value: 650,
          reason: 'Midpoint planning value of guest count range',
        },
      ],
      needs_confirmation: [],
      structured: {
        type: 'none',
        data: null,
      },
    };

    const result = MayaResponseEnvelopeSchema.safeParse(guestRangeEnvelope);
    assert.strictEqual(result.success, true);
    if (result.success) {
      assert.deepStrictEqual(result.data.profile_updates[0].value, { low: 500, high: 800 });
      assert.strictEqual(result.data.profile_updates[1].value, 650);
      assert.strictEqual(result.data.profile_updates[0].action, 'set');
      assert.strictEqual(result.data.profile_updates[0].reason, 'Couple provided guest count range of 500 to 800');
    }
  });

  it('passes validation even if reason and action are omitted and structured is null', () => {
    const relaxedEnvelope = {
      reply: "I'll plan with 650 guests for now.",
      quick_replies: ['OK'],
      profile_updates: [
        {
          path: 'guest_count.range',
          value: { low: 500, high: 800 },
        },
        {
          path: 'guest_count.planning_value',
          value: 650,
        },
      ],
      needs_confirmation: [],
      structured: null,
    };

    const result = MayaResponseEnvelopeSchema.safeParse(relaxedEnvelope);
    assert.strictEqual(result.success, true);
    if (result.success) {
      assert.strictEqual(result.data.profile_updates[0].action, 'set');
      assert.strictEqual(result.data.profile_updates[0].reason, '');
      assert.deepStrictEqual(result.data.structured, { type: 'none', data: null });
    }
  });
});

describe('parseRangeAndPlanningValue Units and Isolation', () => {
  it('"500 - 800 guests" gives guest range 500 to 800 with planning value 650 and does not touch the budget', () => {
    // 1. As guest count (isCurrency = false): parses to 500, 800, 650
    const guestRange = parseRangeAndPlanningValue('500 - 800 guests', false);
    assert.deepStrictEqual(guestRange, {
      low: 500,
      high: 800,
      planning_value: 650,
    });

    // 2. As budget (isCurrency = true): returns null so it never touches the budget
    const budgetRange = parseRangeAndPlanningValue('500 - 800 guests', true);
    assert.strictEqual(budgetRange, null);
  });

  it('"Rs 60-80 lakh" gives budget range 6000000 to 8000000 with planning value 7000000', () => {
    // 1. As budget (isCurrency = true): parses to 6000000, 8000000, 7000000
    const budgetRange = parseRangeAndPlanningValue('Rs 60-80 lakh', true);
    assert.deepStrictEqual(budgetRange, {
      low: 6000000,
      high: 8000000,
      planning_value: 7000000,
    });

    // 2. As guest count (isCurrency = false): returns null because currency keywords are present without guests
    const guestRange = parseRangeAndPlanningValue('Rs 60-80 lakh', false);
    assert.strictEqual(guestRange, null);
  });

  it('parses budget ranges with crore and rupee symbols', () => {
    const crRange = parseRangeAndPlanningValue('₹75 Lakh - 1 Crore', true);
    assert.deepStrictEqual(crRange, {
      low: 7500000,
      high: 10000000,
      planning_value: 8750000,
    });

    const fullRupeeRange = parseRangeAndPlanningValue('Rs 50,00,000 to Rs 75,00,000', true);
    assert.deepStrictEqual(fullRupeeRange, {
      low: 5000000,
      high: 7500000,
      planning_value: 6250000,
    });
  });

  it('rejects numbers without currency units when isCurrency is true', () => {
    const noUnits = parseRangeAndPlanningValue('5000000 - 8000000', true);
    assert.strictEqual(noUnits, null);
  });
});

