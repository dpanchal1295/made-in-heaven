import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { GET as getInviteHandler } from '../../app/api/invites/[token]/route';
import { POST as acceptInviteHandler } from '../../app/api/invites/[token]/accept/route';
import { getWeddingStorage } from '../storage';
import { signSessionPayload, SESSION_COOKIE_NAME } from '../auth/session';

test('Invites flow: absolute URL generation, lookup, and invalid/expired handling', async (t) => {
  const storage = getWeddingStorage();

  await t.test('constructs valid absolute URL from origin and relative invite path', () => {
    const origin = 'https://made-in-heaven-uorx.vercel.app';
    const relativePath = '/invites/token-xyz-123';
    const fullUrl = `${origin}${relativePath}`;

    assert.equal(fullUrl, 'https://made-in-heaven-uorx.vercel.app/invites/token-xyz-123');
    assert.doesNotThrow(() => new URL(fullUrl));
  });

  await t.test('GET /api/invites/[token] returns 404 for invalid/non-existent token', async () => {
    const req = new NextRequest('http://localhost:3000/api/invites/nonexistent-token-404');
    const res = await getInviteHandler(req, { params: Promise.resolve({ token: 'nonexistent-token-404' }) });
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.error, /invalid|not found/i);
  });

  await t.test('POST /api/invites/[token]/accept returns 404 for invalid/non-existent token with valid session', async () => {
    // Create a mock user in storage
    const testUser = await storage.saveUser({
      uid: 'rohan-guest-uid',
      name: 'Rohan Guest',
      email: 'rohan.guest@test.local',
      isGuest: true,
      homeIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const now = Date.now();
    const token = signSessionPayload({ uid: testUser.uid, issuedAt: now, expiresAt: now + 3600000 });
    const req = new NextRequest('http://localhost:3000/api/invites/nonexistent-token-404/accept', {
      method: 'POST',
      body: JSON.stringify({ name: 'Rohan', preferredLanguage: 'gu' }),
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:3000',
        Cookie: `${SESSION_COOKIE_NAME}=${token}`,
      },
    });

    const res = await acceptInviteHandler(req, { params: Promise.resolve({ token: 'nonexistent-token-404' }) });
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.error, /invalid|not found/i);
  });

  await t.test('GET /api/invites/[token] returns invite details for valid token', async () => {
    // Create test home and invite
    const { home } = await storage.createHomeWithDetails({
      coupleNames: 'Rohan & Ananya Wedding',
      eventType: 'wedding',
      city: 'Udaipur',
      date: '2026-12-18',
      ownerUid: 'test-user-1',
      ownerName: 'Rohan',
    });

    const inviteToken = `inv-valid-${Date.now()}`;
    const invite = await storage.createInvite({
      token: inviteToken,
      homeId: home.id,
      createdBy: 'test-user-1',
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      createdAt: Date.now(),
    });

    const req = new NextRequest(`http://localhost:3000/api/invites/${invite.token}`);
    const res = await getInviteHandler(req, { params: Promise.resolve({ token: invite.token }) });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.invite.token, invite.token);
    assert.equal(body.invite.homeName, 'Rohan & Ananya Wedding');
    assert.equal(body.invite.permission, 'voter');
    assert.equal(body.invite.eventType, 'wedding');
  });

  await t.test('GET /api/invites/[token] returns 410 when token has expired', async () => {
    const { home } = await storage.createHomeWithDetails({
      coupleNames: 'Old Celebration',
      eventType: 'birthday',
      city: 'Mumbai',
      date: '2026-01-01',
      ownerUid: 'test-user-2',
      ownerName: 'Priya',
    });

    const expiredToken = `inv-expired-${Date.now()}`;
    const expiredInvite = await storage.createInvite({
      token: expiredToken,
      homeId: home.id,
      createdBy: 'test-user-2',
      expiresAt: Date.now() - 24 * 60 * 60 * 1000, // expired yesterday
      createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    });

    const req = new NextRequest(`http://localhost:3000/api/invites/${expiredInvite.token}`);
    const res = await getInviteHandler(req, { params: Promise.resolve({ token: expiredInvite.token }) });
    assert.equal(res.status, 410);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.error, /expired/i);
  });
});
