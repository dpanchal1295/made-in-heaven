import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MOCK_CHAT_ENVELOPES, getMockPlanEnvelope } from './fixtures';

process.env.MAYA_MOCK = 'true';

test('mock chat responses always produce non-empty reply and quick replies', () => {
  for (const [key, envelope] of Object.entries(MOCK_CHAT_ENVELOPES)) {
    assert.ok(typeof envelope.reply === 'string', `${key} reply must be string`);
    assert.ok(envelope.reply.trim().length > 0, `${key} reply must not be empty`);
    assert.ok(typeof envelope.spoken_reply === 'string' && envelope.spoken_reply.length > 0, `${key} spoken_reply`);
    assert.ok(Array.isArray(envelope.quick_replies), `${key} quick_replies array`);
    assert.ok(envelope.quick_replies.length > 0, `${key} must have quick_reply choices`);
  }
});

test('mock plan envelopes have non-empty replies and conform to structured types', () => {
  const parts = ['budget', 'timeline', 'checklist', 'palette', 'decor', 'attire'] as const;
  for (const part of parts) {
    const envelope = getMockPlanEnvelope(part);
    assert.ok(envelope.reply.trim().length > 0, `${part} reply cannot be empty`);
    assert.equal(envelope.structured.type, part);
    assert.ok(envelope.structured.data !== null, `${part} structured data cannot be null`);
  }
});

