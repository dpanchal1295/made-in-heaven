import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  canVote,
  validateVote,
  countVotes,
  tallyRound,
  validateCoupleChoice,
  DecisionMember,
} from './tally';

// Demo Home: Aarav & Diya (couple), Diya's mother (voter), Aarav's brother (advisor), Diya's friend (viewer)
const members: DecisionMember[] = [
  { uid: 'aarav', permission: 'couple' },
  { uid: 'diya', permission: 'couple' },
  { uid: 'mother', permission: 'voter' },
  { uid: 'brother', permission: 'advisor' },
  { uid: 'friend', permission: 'viewer' },
];
const ABC = ['A', 'B', 'C'];

test('only the couple and voters can vote', () => {
  assert.equal(canVote({ permission: 'couple' }), true);
  assert.equal(canVote({ permission: 'voter' }), true);
  assert.equal(canVote({ permission: 'advisor' }), false);
  assert.equal(canVote({ permission: 'viewer' }), false);
  assert.equal(canVote(null), false);
});

test('validateVote rejects advisors, closed decisions and unknown options', () => {
  assert.match(validateVote(members[3], 'A', ABC, 'open')!, /Only the couple/);
  assert.match(validateVote(members[0], 'A', ABC, 'closed')!, /not open/);
  assert.match(validateVote(members[0], 'Z', ABC, 'open')!, /not part/);
  assert.match(validateVote(null, 'A', ABC, 'open')!, /not a member/);
  assert.equal(validateVote(members[2], 'B', ABC, 'open'), null);
  assert.equal(validateVote(members[2], 'B', ['A', 'B'], 'runoff'), null);
});

test('countVotes ignores ineligible members and options outside the round', () => {
  const { counts, totalVotes } = countVotes(
    ['A', 'B'],
    { aarav: 'A', diya: 'B', mother: 'C', brother: 'A', friend: 'A', stranger: 'A' },
    members
  );
  assert.deepEqual(counts, { A: 1, B: 1 });
  assert.equal(totalVotes, 2);
});

test('three voters, clear majority wins in the first round', () => {
  const r = tallyRound(ABC, { aarav: 'A', diya: 'A', mother: 'B' }, members, 'first');
  assert.equal(r.kind, 'winner');
  if (r.kind === 'winner') {
    assert.equal(r.optionId, 'A');
    assert.equal(r.decidedBy, 'majority');
    assert.equal(r.totalVotes, 3);
  }
});

test('an advisor vote never changes the result', () => {
  // Without the advisor: A=1, B=2 -> B wins. The advisor's vote for A must not count.
  const r = tallyRound(ABC, { aarav: 'A', diya: 'B', mother: 'B', brother: 'A' }, members, 'first');
  assert.equal(r.kind, 'winner');
  if (r.kind === 'winner') assert.equal(r.optionId, 'B');
});

test('exactly half is not a majority: 2-2 goes to the couple', () => {
  const four: DecisionMember[] = [...members, { uid: 'father', permission: 'voter' }];
  const r = tallyRound(['A', 'B'], { aarav: 'A', diya: 'A', mother: 'B', father: 'B' }, four, 'first');
  assert.equal(r.kind, 'couple_decides');
  if (r.kind === 'couple_decides') assert.deepEqual(r.optionIds, ['A', 'B']);
});

test('no majority with a clear top two leads to a runoff', () => {
  const five: DecisionMember[] = [
    ...members,
    { uid: 'father', permission: 'voter' },
    { uid: 'aunt', permission: 'voter' },
  ];
  const r = tallyRound(
    ['A', 'B', 'C'],
    { aarav: 'A', diya: 'A', mother: 'B', father: 'B', aunt: 'C' },
    five,
    'first'
  );
  // A=2, B=2, C=1 of 5 -> no majority; top two are A and B
  assert.equal(r.kind, 'runoff');
  if (r.kind === 'runoff') assert.deepEqual([...r.optionIds].sort(), ['A', 'B']);
});

test('three voters split three ways: the couple decides between all three', () => {
  const r = tallyRound(ABC, { aarav: 'A', diya: 'B', mother: 'C' }, members, 'first');
  assert.equal(r.kind, 'couple_decides');
  if (r.kind === 'couple_decides') assert.deepEqual([...r.optionIds].sort(), ['A', 'B', 'C']);
});

test('runoff with a majority produces a winner', () => {
  const r = tallyRound(['A', 'B'], { aarav: 'B', diya: 'B', mother: 'A' }, members, 'runoff');
  assert.equal(r.kind, 'winner');
  if (r.kind === 'winner') {
    assert.equal(r.optionId, 'B');
    assert.equal(r.decidedBy, 'runoff_majority');
  }
});

test('runoff tie: the couple decides', () => {
  const r = tallyRound(['A', 'B'], { aarav: 'A', mother: 'B' }, members, 'runoff');
  assert.equal(r.kind, 'couple_decides');
  if (r.kind === 'couple_decides') assert.deepEqual([...r.optionIds].sort(), ['A', 'B']);
});

test('no votes cast: no result', () => {
  const r = tallyRound(ABC, {}, members, 'first');
  assert.equal(r.kind, 'no_votes');
});

test('a single vote is a majority of votes cast', () => {
  const r = tallyRound(ABC, { mother: 'C' }, members, 'first');
  assert.equal(r.kind, 'winner');
  if (r.kind === 'winner') assert.equal(r.optionId, 'C');
});

test('only the couple can break a tie, and only between the tied options', () => {
  assert.equal(validateCoupleChoice(members[0], 'A', ['A', 'B']), null);
  assert.match(validateCoupleChoice(members[2], 'A', ['A', 'B'])!, /Only the couple/);
  assert.match(validateCoupleChoice(members[1], 'C', ['A', 'B'])!, /tied options/);
});

