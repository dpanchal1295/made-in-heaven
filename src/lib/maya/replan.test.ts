import { test } from 'node:test';
import assert from 'node:assert/strict';
import { executeReplan } from './replanEngine';
import { LocalWeddingStorage } from '@/lib/storage/localStorage';

test('replan engine computes affected parts and explains what changed and why', async () => {
  const storage = new LocalWeddingStorage();
  const homeId = 'demo-home-1';

  // Test guest count change
  const guestReplan = await executeReplan(storage, homeId, 'guest_count', 450);
  assert.ok(guestReplan.plan);
  assert.ok(guestReplan.changes.length > 0);
  const budgetChange = guestReplan.changes.find((c) => c.part === 'budget');
  assert.ok(budgetChange);
  assert.match(budgetChange.what_changed, /Recalculated/);
  assert.match(budgetChange.why, /plate multipliers/);

  // Test decision outcome change
  const venueDecisionReplan = await executeReplan(storage, homeId, 'decision.dec_123', 'A');
  assert.ok(venueDecisionReplan.plan);
  const decorChange = venueDecisionReplan.changes.find((c) => c.part === 'decor');
  assert.ok(decorChange);
  assert.match(decorChange.what_changed, /decor concept/);
  assert.match(decorChange.why, /decision outcome/);
});

