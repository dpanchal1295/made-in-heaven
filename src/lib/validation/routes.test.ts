import { test } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import { DecisionBriefDataSchema as DecisionBriefSchema } from '@/lib/maya/schemas';

test('validates DecisionBriefSchema for group synthesis', () => {
  const validBrief = {
    topic: 'Venue Selection',
    member_ideas: [{ member: 'Aarav', idea: 'Heritage lawn' }],
    common_ground: ['Outdoor garden preference'],
    conflicts: [
      {
        issue: 'Budget vs Grandeur',
        sides: [{ member: 'Aarav', position: 'Stick to budget' }],
      },
    ],
    options: [
      {
        id: 'A',
        name: 'Heritage Resort',
        what_it_includes: 'Lawn + Banquet',
        who_gets_what: [{ member: 'Aarav', gets: 'Lawn' }],
        cost_tier: '₹₹',
        fits_locked_constraints: true,
        fits_budget: true,
      },
    ],
    recommendation: {
      option_id: 'A',
      why: 'Fits locked constraints and budget',
    },
  };

  const parsed = DecisionBriefSchema.safeParse(validBrief);
  assert.equal(parsed.success, true);
});

test('rejects messages longer than 2000 characters', () => {
  const MessageSchema = z.string().min(1).max(2000);
  const shortMessage = 'A wonderful wedding idea';
  const longMessage = 'a'.repeat(2001);

  assert.equal(MessageSchema.safeParse(shortMessage).success, true);
  assert.equal(MessageSchema.safeParse(longMessage).success, false);
});

