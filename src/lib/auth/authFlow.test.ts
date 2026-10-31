import { describe, it } from 'node:test';
import assert from 'node:assert';
import { checkOrigin } from '../security/originCheck';
import { getWeddingStorage } from '../storage';

describe('Auth & Multi-Tenant Security Tests', () => {
  it('checkOrigin allows valid origins and rejects cross-site attacks', () => {
    // Valid origins
    const localReq = new Request('http://localhost:3000/api/decisions', {
      method: 'POST',
      headers: { origin: 'http://localhost:3000' },
    });
    assert.strictEqual(checkOrigin(localReq), true);

    const vercelReq = new Request('https://made-in-heaven-uorx.vercel.app/api/homes', {
      method: 'POST',
      headers: { origin: 'https://made-in-heaven-uorx.vercel.app' },
    });
    assert.strictEqual(checkOrigin(vercelReq), true);

    const previewReq = new Request('https://made-in-heaven-uorx-abc1234-dpanchal1295s-projects.vercel.app/api/homes', {
      method: 'POST',
      headers: { origin: 'https://made-in-heaven-uorx-abc1234-dpanchal1295s-projects.vercel.app' },
    });
    assert.strictEqual(checkOrigin(previewReq), true);

    // Other vercel domains must be rejected
    const otherVercelReq = new Request('https://made-in-heaven-preview-123.vercel.app/api/homes', {
      method: 'POST',
      headers: { origin: 'https://made-in-heaven-preview-123.vercel.app' },
    });
    assert.strictEqual(checkOrigin(otherVercelReq), false);

    const genericVercelReq = new Request('https://random-app.vercel.app/api/homes', {
      method: 'POST',
      headers: { origin: 'https://random-app.vercel.app' },
    });
    assert.strictEqual(checkOrigin(genericVercelReq), false);

    // Malicious or unauthorized origin
    const evilReq = new Request('https://made-in-heaven-uorx.vercel.app/api/homes', {
      method: 'POST',
      headers: { origin: 'https://evil-attacker.com' },
    });
    assert.strictEqual(checkOrigin(evilReq), false);
  });

  it('multi-tenant isolation: non-member cannot access home or cast vote', async () => {
    const storage = getWeddingStorage();
    
    // Create home A with host user A
    const { home: homeA } = await storage.createHomeWithDetails({
      coupleNames: 'Rohan & Ananya',
      city: 'Delhi',
      eventType: 'wedding',
      ownerUid: 'user-a-1',
      ownerName: 'Rohan',
    });

    // Create home B with host user B
    await storage.createHomeWithDetails({
      coupleNames: 'Vikram 40th Birthday',
      city: 'Mumbai',
      eventType: 'birthday',
      ownerUid: 'user-b-1',
      ownerName: 'Vikram',
    });

    // Check membership isolation
    const membersA = await storage.getMembers(homeA.id);
    const hasUserA = membersA.some((m) => m.uid === 'user-a-1');
    const hasUserB = membersA.some((m) => m.uid === 'user-b-1');
    assert.strictEqual(hasUserA, true, 'User A is in Home A');
    assert.strictEqual(hasUserB, false, 'User B must NOT be found in Home A');

    // Create a decision in Home A
    await storage.saveDecision(homeA.id, {
      id: 'dec_test_1',
      roomId: 'venue',
      topic: 'Select Lawn or Banquet',
      options: [
        {
          id: 'opt_1',
          name: 'Grand Lawn',
          what_it_includes: 'Open lawn space',
          who_gets_what: [],
          cost_tier: '₹₹',
          fits_locked_constraints: true,
          fits_budget: true,
        },
        {
          id: 'opt_2',
          name: 'Royal Banquet',
          what_it_includes: 'Indoor AC hall',
          who_gets_what: [],
          cost_tier: '₹₹₹',
          fits_locked_constraints: true,
          fits_budget: true,
        },
      ],
      votes: {},
      status: 'open',
      round: 'first',
    });

    // Verify non-member cannot vote
    const intruder = membersA.find((m) => m.uid === 'user-b-1');
    const isAllowedToVote = intruder ? (intruder.permission === 'couple' || intruder.permission === 'voter') : false;
    assert.strictEqual(isAllowedToVote, false, 'Non-member cannot cast a vote');

    // Add a guest viewer with budget privacy restricted
    await storage.addMemberToHome(homeA.id, {
      uid: 'user-guest-view',
      name: 'Guest Viewer',
      relationship: 'Friend',
      permission: 'viewer',
      preferredLanguage: 'en',
      interests: [],
      canSeeBudget: false,
    });

    const membersUpdated = await storage.getMembers(homeA.id);
    const guestMember = membersUpdated.find((m) => m.uid === 'user-guest-view');
    assert.ok(guestMember);
    assert.strictEqual(guestMember.canSeeBudget, false);
  });
});
