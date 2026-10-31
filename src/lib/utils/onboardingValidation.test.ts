import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getOnboardingStatus } from '@/lib/utils/format';
import { EventProfile } from '@/types/firestore';

test('onboarding validation: required fields customize labels per celebration eventType', () => {
  // 1. Wedding
  const weddingProfile: EventProfile = {
    eventType: 'wedding',
    date: '2026-12-18',
    city: 'Pune',
    guest_count: { planning_value: 300 },
    culture: ['Maharashtrian'],
    vibe: 'Heritage Royal',
    communication_style: { honesty_preference: 'balanced' },
  };
  const weddingStatus = getOnboardingStatus(weddingProfile, { total: 800000, updatedAt: 1730000000000 });
  assert.equal(weddingStatus.isFullyComplete, true);
  assert.equal(weddingStatus.percent, 100);

  // 2. Birthday (missing fields check)
  const partialBirthdayProfile: EventProfile = {
    eventType: 'birthday',
    date: '2026-11-15',
    city: 'Ahmedabad',
    guest_count: { estimate: 120 },
  };
  const birthdayStatus = getOnboardingStatus(partialBirthdayProfile, null);
  assert.equal(birthdayStatus.isCoreComplete, false);
  assert.ok(birthdayStatus.missingFields.includes('Budget (in INR)'));
  assert.ok(birthdayStatus.missingFields.includes('Culture & Traditions'));
  assert.ok(birthdayStatus.missingFields.includes('Birthday Theme & Milestone'));

  // 3. Community Event (missing fields check)
  const partialCommunityProfile: EventProfile = {
    eventType: 'community',
    date: '2026-10-12',
    culture: ['Gujarati'],
  };
  const communityStatus = getOnboardingStatus(partialCommunityProfile, null);
  assert.equal(communityStatus.isCoreComplete, false);
  assert.ok(communityStatus.missingFields.includes('Location / Society Grounds'));
  assert.ok(communityStatus.missingFields.includes('Expected Footfall'));
  assert.ok(communityStatus.missingFields.includes('Occasion & Setup Style'));
});

