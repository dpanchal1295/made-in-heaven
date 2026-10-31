import test from 'node:test';
import assert from 'node:assert/strict';
import { getWeddingStorage } from './index';
import { getGreeting, SUPPORTED_LANGUAGES } from '../utils/i18n';

test('Stage 1: Server-Side Member Permission & Budget Access Isolation', async () => {
  const storage = getWeddingStorage();

  // 1. Couple (Aarav and Diya) has budget access
  const aarav = await storage.getSpeaker('demo-home-1', 'demo-aarav-1');
  assert.equal(aarav.uid, 'demo-aarav-1');
  assert.equal(aarav.permission, 'couple');
  assert.equal(aarav.canSeeBudget, true);

  const diya = await storage.getSpeaker('demo-home-1', 'demo-diya-1');
  assert.equal(diya.uid, 'demo-diya-1');
  assert.equal(diya.permission, 'couple');
  assert.equal(diya.canSeeBudget, true);

  // 2. Mother (Meenakshi) has budget access & Gujarati language
  const mother = await storage.getSpeaker('demo-home-1', 'demo-mother-1');
  assert.equal(mother.uid, 'demo-mother-1');
  assert.equal(mother.relationship, 'mother');
  assert.equal(mother.permission, 'voter');
  assert.equal(mother.preferredLanguage, 'gu');
  assert.equal(mother.canSeeBudget, true);

  // 3. Brother (Kabir) has budget access FALSE & Hindi language
  const brother = await storage.getSpeaker('demo-home-1', 'demo-brother-1');
  assert.equal(brother.uid, 'demo-brother-1');
  assert.equal(brother.relationship, 'brother');
  assert.equal(brother.permission, 'advisor');
  assert.equal(brother.preferredLanguage, 'hi');
  assert.equal(brother.canSeeBudget, false);

  // 4. Friend (Rhea) has budget access FALSE & English language
  const friend = await storage.getSpeaker('demo-home-1', 'demo-friend-1');
  assert.equal(friend.uid, 'demo-friend-1');
  assert.equal(friend.relationship, 'friend');
  assert.equal(friend.permission, 'viewer');
  assert.equal(friend.canSeeBudget, false);
});

test('Stage 1: Invite Code Lookup & Home Creation', async () => {
  const storage = getWeddingStorage();

  // Test demo invite code lookup
  const demoHome = await storage.getHomeByInviteCode('MIH-2026');
  assert.ok(demoHome);
  assert.equal(demoHome?.id, 'demo-home-1');

  // Test case-insensitivity and trim
  const demoHomeLower = await storage.getHomeByInviteCode('  mih-2026 ');
  assert.ok(demoHomeLower);
  assert.equal(demoHomeLower?.id, 'demo-home-1');

  // Test create custom home
  const created = await storage.createHomeWithDetails({
    coupleNames: 'Rohan & Ananya',
    date: '2027-02-14',
    city: 'Jaipur',
    ownerUid: 'rohan-123',
    ownerName: 'Rohan',
    preferredLanguage: 'hi',
  });

  assert.ok(created.home.id);
  assert.equal(created.home.name, 'Rohan & Ananya');
  assert.equal(created.home.profile.city, 'Jaipur');
  assert.equal(created.home.profile.date, '2027-02-14');
  assert.equal(created.member.permission, 'couple');
  assert.equal(created.member.canSeeBudget, true);
});

test('Stage 1: Localized Greetings & Native Script Verification', () => {
  // Test native script greetings
  assert.equal(getGreeting('en', 'Diya'), 'Namaste, Diya!');
  assert.equal(getGreeting('hi', 'दिया'), 'नमस्ते, दिया!');
  assert.equal(getGreeting('gu', 'દિયા'), 'નમસ્તે, દિયા!');
  assert.equal(getGreeting('pa', 'ਦੀਆ'), 'ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ, ਦੀਆ!');
  assert.equal(getGreeting('mr', 'दिया'), 'नमस्कार, दिया!');

  // Verify all 5 supported languages have native labels
  const codes = SUPPORTED_LANGUAGES.map((l) => l.code);
  assert.deepEqual(codes, ['en', 'hi', 'gu', 'pa', 'mr']);
  const nativeLabels = SUPPORTED_LANGUAGES.map((l) => l.nativeLabel);
  assert.deepEqual(nativeLabels, ['English', 'हिन्दी', 'ગુજરાતી', 'ਪੰਜਾਬੀ', 'मराठी']);
});
