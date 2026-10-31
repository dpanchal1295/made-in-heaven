import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canVote } from './tally';

test('permission privileges matrix for voting and roles', () => {
  // Couple and voters can vote
  assert.equal(canVote({ permission: 'couple' }), true);
  assert.equal(canVote({ permission: 'voter' }), true);

  // Advisors and viewers cannot vote
  assert.equal(canVote({ permission: 'advisor' }), false);
  assert.equal(canVote({ permission: 'viewer' }), false);

  // Missing or undefined permission cannot vote
  assert.equal(canVote(null), false);
  assert.equal(canVote(undefined), false);
});

test('canVote toggle translates directly to voter or advisor', () => {
  function mapCanVoteToggle(canVoteFlag: boolean): 'voter' | 'advisor' {
    return canVoteFlag ? 'voter' : 'advisor';
  }

  assert.equal(mapCanVoteToggle(true), 'voter');
  assert.equal(mapCanVoteToggle(false), 'advisor');
});

