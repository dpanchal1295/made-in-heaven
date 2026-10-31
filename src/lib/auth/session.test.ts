import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  signSessionPayload,
  verifySessionPayload,
  SessionData,
} from './session';

process.env.SESSION_SECRET = 'test-secret-value-for-backend-unit-tests-123456';

test('signs and verifies a valid session payload', () => {
  const payload: SessionData = {
    uid: 'demo-aarav-1',
    homeId: 'demo-home-1',
    issuedAt: Date.now(),
    expiresAt: Date.now() + 60000,
  };

  const token = signSessionPayload(payload);
  assert.ok(typeof token === 'string' && token.includes('.'));

  const verified = verifySessionPayload(token);
  assert.ok(verified !== null);
  assert.equal(verified?.uid, 'demo-aarav-1');
  assert.equal(verified?.homeId, 'demo-home-1');
});

test('rejects tampered session payloads', () => {
  const payload: SessionData = {
    uid: 'demo-brother-1',
    homeId: 'demo-home-1',
    issuedAt: Date.now(),
    expiresAt: Date.now() + 60000,
  };

  const token = signSessionPayload(payload);
  const parts = token.split('.');
  // Tamper with base64 payload to pretend to be aarav
  const tamperedData = Buffer.from(
    JSON.stringify({ ...payload, uid: 'demo-aarav-1' })
  ).toString('base64url');
  const tamperedToken = `${tamperedData}.${parts[1]}`;

  const verified = verifySessionPayload(tamperedToken);
  assert.equal(verified, null);
});

test('rejects expired session tokens', () => {
  const payload: SessionData = {
    uid: 'demo-mother-1',
    homeId: 'demo-home-1',
    issuedAt: Date.now() - 10000,
    expiresAt: Date.now() - 1000, // Expired 1 second ago
  };

  const token = signSessionPayload(payload);
  const verified = verifySessionPayload(token);
  assert.equal(verified, null);
});

test('rejects malformed session token formats', () => {
  assert.equal(verifySessionPayload(''), null);
  assert.equal(verifySessionPayload('invalid-single-string'), null);
  assert.equal(verifySessionPayload('part1.part2.part3'), null);
});

