/**
 * Majority voting for family decisions (Made in Heaven).
 * Pure functions only: no I/O, no AI. Maya never counts votes; this code does.
 *
 * Rules (maya_prompts_v4.md, Part B):
 * 1. Eligible voters = the couple + members with permission "voter".
 * 2. Each eligible voter casts one vote for one option (a later vote replaces an earlier one).
 * 3. Winner = option with MORE than half of the votes cast.
 * 4. No majority -> runoff between the top two options.
 * 5. Runoff tie (or a tie that stops us picking exactly two) -> the couple decides.
 */

export type Permission = 'couple' | 'voter' | 'advisor' | 'viewer';

export interface DecisionMember {
  uid: string;
  permission: Permission;
}

export type DecisionRound = 'first' | 'runoff';

export type TallyResult =
  | { kind: 'no_votes'; counts: Record<string, number>; totalVotes: 0 }
  | {
      kind: 'winner';
      optionId: string;
      decidedBy: 'majority' | 'runoff_majority';
      counts: Record<string, number>;
      totalVotes: number;
    }
  | { kind: 'runoff'; optionIds: [string, string]; counts: Record<string, number>; totalVotes: number }
  | { kind: 'couple_decides'; optionIds: string[]; counts: Record<string, number>; totalVotes: number };

/** Only the couple and members granted a vote may vote. Advisors and viewers never vote. */
export function canVote(member: Pick<DecisionMember, 'permission'> | null | undefined): boolean {
  return member?.permission === 'couple' || member?.permission === 'voter';
}

/**
 * Checks a single vote before it is saved. Returns an error message, or null if the vote is valid.
 */
export function validateVote(
  member: DecisionMember | null | undefined,
  optionId: string,
  activeOptionIds: string[],
  status: 'open' | 'runoff' | 'awaiting_couple' | 'closed'
): string | null {
  if (!member) return 'You are not a member of this Home.';
  if (!canVote(member)) return 'Only the couple and members with a vote can vote on decisions.';
  if (status !== 'open' && status !== 'runoff') return 'Voting is not open for this decision.';
  if (!activeOptionIds.includes(optionId)) return 'That option is not part of this vote.';
  return null;
}

/**
 * Counts votes for the active options, ignoring votes from ineligible members
 * and votes for options that are not in this round.
 */
export function countVotes(
  activeOptionIds: string[],
  votes: Record<string, string>,
  members: DecisionMember[]
): { counts: Record<string, number>; totalVotes: number } {
  const eligible = new Set(members.filter(canVote).map((m) => m.uid));
  const counts: Record<string, number> = {};
  for (const id of activeOptionIds) counts[id] = 0;

  let totalVotes = 0;
  for (const [uid, optionId] of Object.entries(votes)) {
    if (!eligible.has(uid)) continue;
    if (!(optionId in counts)) continue;
    counts[optionId] += 1;
    totalVotes += 1;
  }
  return { counts, totalVotes };
}

/**
 * Decides the outcome of a round.
 * - round "first": majority wins, otherwise a runoff between the top two.
 * - round "runoff": majority wins, otherwise the couple decides.
 */
export function tallyRound(
  activeOptionIds: string[],
  votes: Record<string, string>,
  members: DecisionMember[],
  round: DecisionRound
): TallyResult {
  const { counts, totalVotes } = countVotes(activeOptionIds, votes, members);

  if (totalVotes === 0) {
    return { kind: 'no_votes', counts, totalVotes: 0 };
  }

  // Majority = strictly more than half of the votes cast
  for (const id of activeOptionIds) {
    if (counts[id] * 2 > totalVotes) {
      return {
        kind: 'winner',
        optionId: id,
        decidedBy: round === 'first' ? 'majority' : 'runoff_majority',
        counts,
        totalVotes,
      };
    }
  }

  // Sort by votes (highest first); keep original option order for equal counts
  const ranked = [...activeOptionIds].sort((a, b) => counts[b] - counts[a]);

  if (round === 'runoff') {
    const top = counts[ranked[0]];
    return {
      kind: 'couple_decides',
      optionIds: ranked.filter((id) => counts[id] === top),
      counts,
      totalVotes,
    };
  }

  // First round, no majority: pick the top two for a runoff.
  const first = counts[ranked[0]];
  const second = counts[ranked[1]];
  const third = ranked.length > 2 ? counts[ranked[2]] : -1;

  // A tie at the cut-off (e.g. 1-1-1) means we cannot pick exactly two: the couple decides.
  if (third === second) {
    return {
      kind: 'couple_decides',
      optionIds: ranked.filter((id) => counts[id] >= second),
      counts,
      totalVotes,
    };
  }

  // Exactly two options and they tie (e.g. 1-1): a runoff would repeat the tie, so the couple decides.
  if (ranked.length === 2 && first === second) {
    return { kind: 'couple_decides', optionIds: [ranked[0], ranked[1]], counts, totalVotes };
  }

  return { kind: 'runoff', optionIds: [ranked[0], ranked[1]], counts, totalVotes };
}

/**
 * The couple's final choice when a decision reaches "couple_decides".
 * Returns an error message, or null if the choice is valid.
 */
export function validateCoupleChoice(
  member: DecisionMember | null | undefined,
  optionId: string,
  tiedOptionIds: string[]
): string | null {
  if (!member || member.permission !== 'couple') return 'Only the couple can break a tie.';
  if (!tiedOptionIds.includes(optionId)) return 'Please choose one of the tied options.';
  return null;
}

