import { describe, it } from 'node:test';
import assert from 'node:assert';
import { COPY, getCelebrationTerms } from '@/config/copy';
import { generateFirstMessage } from './firstMessage';

describe('Copy and Single-Celebration Consistency', () => {
  it('all required copy keys exist in COPY', () => {
    assert.ok(COPY.brand.name);
    assert.ok(COPY.brand.tagline);
    assert.strictEqual(COPY.brand.tagline, 'Your celebration planner');
    assert.strictEqual(COPY.profilePanel.title, 'What Maya knows so far');
    assert.ok(COPY.homePage.title);
    assert.ok(COPY.plan.summaryStrip.notSet);
    assert.ok(COPY.header.myCelebrations);
  });

  it('getCelebrationTerms provides adaptive terms for wedding, birthday, and community', () => {
    const weddingTerms = getCelebrationTerms('wedding');
    assert.strictEqual(weddingTerms.ownerLabel, 'Couple');
    assert.strictEqual(weddingTerms.celebrationTypeLabel, 'Wedding');

    const birthdayTerms = getCelebrationTerms('birthday');
    assert.strictEqual(birthdayTerms.ownerLabel, 'Host');
    assert.strictEqual(birthdayTerms.celebrationTypeLabel, 'Birthday');

    const communityTerms = getCelebrationTerms('community');
    assert.strictEqual(communityTerms.ownerLabel, 'Organiser');
    assert.strictEqual(communityTerms.celebrationTypeLabel, 'Community Gathering');
  });

  it('first message never asks for already-saved fields', () => {
    // Birthday with date and city already saved
    const birthdayMsg = generateFirstMessage(
      "Papa's 60th",
      {
        eventType: 'birthday',
        date: '2026-11-20',
        city: 'Bengaluru',
      },
      null,
      {
        uid: 'user-1',
        name: 'Rohan',
        relationship: 'Son',
        permission: 'couple',
        preferredLanguage: 'en',
        interests: [],
        canSeeBudget: true,
      }
    );

    // Should NOT ask for date or city again
    assert.strictEqual(birthdayMsg.reply.includes('what date or weekend'), false);
    assert.strictEqual(birthdayMsg.reply.includes('which city'), false);
    // Should acknowledge saved city and date
    assert.ok(birthdayMsg.reply.includes('Bengaluru') || birthdayMsg.reply.includes('2026-11-20'));
    // Next missing question is guest count
    assert.ok(birthdayMsg.reply.toLowerCase().includes('guest') || birthdayMsg.reply.toLowerCase().includes('how many'));

    // Community event with date, footfall, and budget already saved
    const communityMsg = generateFirstMessage(
      'Diwali Society Milan',
      {
        eventType: 'community',
        date: '2026-11-01',
        city: 'Ahmedabad',
        guest_count: { planning_value: 500 },
      },
      {
        total: 300000,
        planning_value: 300000,
        breakdown_by_category: {},
        updatedAt: Date.now(),
      },
      {
        uid: 'user-2',
        name: 'Sunita',
        relationship: 'Secretary',
        permission: 'couple',
        preferredLanguage: 'en',
        interests: [],
        canSeeBudget: true,
      }
    );

    // Should NOT ask for date, footfall, or budget
    assert.strictEqual(communityMsg.reply.includes('dates or festive dates'), false);
    assert.strictEqual(communityMsg.reply.includes('footfall'), false);
    assert.strictEqual(communityMsg.reply.includes('estimated budget'), false);
    // Should ask for highlights/programs
    assert.ok(communityMsg.reply.includes('cultural programs') || communityMsg.reply.includes('highlights'));
  });

  it('wedding first message does not ask for date or city if already provided at start', () => {
    const weddingMsg = generateFirstMessage(
      'Aarav and Meera',
      {
        eventType: 'wedding',
        date: '2027-02-14',
        city: 'Udaipur',
      },
      null,
      {
        uid: 'user-3',
        name: 'Aarav',
        relationship: 'Groom',
        permission: 'couple',
        preferredLanguage: 'en',
        interests: [],
        canSeeBudget: true,
      }
    );

    assert.strictEqual(weddingMsg.reply.includes('When are you thinking of having the celebration'), false);
    assert.strictEqual(weddingMsg.reply.includes('Which city or destination'), false);
    assert.ok(weddingMsg.reply.includes('Udaipur'));
    assert.ok(weddingMsg.reply.includes('guest') || weddingMsg.reply.includes('how many'));
  });
});

