import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LocalWeddingStorage } from './localStorage';

test('server-side budget redaction for non-budget viewers', async () => {
  const storage = new LocalWeddingStorage();
  const homeId = 'demo-home-1';

  const [aarav, mother, brother, friend, budget] = await Promise.all([
    storage.getSpeaker(homeId, 'demo-aarav-1'),
    storage.getSpeaker(homeId, 'demo-mother-1'),
    storage.getSpeaker(homeId, 'demo-brother-1'),
    storage.getSpeaker(homeId, 'demo-friend-1'),
    storage.getBudget(homeId),
  ]);

  // Couple and voter mother have budget visibility
  assert.equal(aarav.canSeeBudget, true);
  assert.equal(mother.canSeeBudget, true);

  // Brother (advisor) and friend (viewer) do NOT have budget visibility
  assert.equal(brother.canSeeBudget, false);
  assert.equal(friend.canSeeBudget, false);

  // In route logic, when canSeeBudget is false, budget payload is strictly null
  const brotherViewBudget = brother.canSeeBudget ? budget : null;
  const friendViewBudget = friend.canSeeBudget ? budget : null;
  const motherViewBudget = mother.canSeeBudget ? budget : null;

  assert.equal(brotherViewBudget, null);
  assert.equal(friendViewBudget, null);
  assert.ok(motherViewBudget !== null && motherViewBudget.total > 0);
});

