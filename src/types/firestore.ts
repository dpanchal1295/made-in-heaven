/**
 * Firestore Data Model Types for Made in Heaven
 * Based on Section 4 of antigravity_build_brief.md
 */

export type MemberPermission = 'couple' | 'voter' | 'advisor' | 'viewer';

export type IndianLanguage = 'en' | 'hi' | 'gu' | 'pa' | 'mr';

export type HonestyPreference = 'gentle' | 'balanced' | 'straight-to-the-point';

export type RoomTopic = 'Venue' | 'Food' | 'Outfits' | 'Decor' | 'Budget' | 'General' | string;

export type DecisionStatus = 'open' | 'runoff' | 'awaiting_couple' | 'closed';

export type EventType = 'wedding' | 'birthday' | 'community';

/**
 * Event Profile JSON stored inside homes/{homeId}
 * CRITICAL RULE: Strictly NO budget fields inside profile (budget lives in homes/{homeId}/private/budget).
 */
export interface EventProfile {
  eventType?: EventType;
  eventSubtype?: string; // e.g. "50th birthday", "Navratri garba", "Ganesh utsav"
  date?: string;
  city?: string;
  guest_count?: {
    estimate?: number;
    range?: {
      low: number;
      high: number;
    };
    planning_value?: number;
    per_function?: Record<string, number>;
  };
  culture?: string[];
  vibe?: string;
  functions?: string[];
  locked_constraints?: string[];
  learned_preferences?: {
    liked?: string[];
    disliked?: string[];
  };
  communication_style?: {
    honesty_preference?: HonestyPreference;
  };
}

/**
 * homes/{homeId}
 */
export interface Home {
  id: string;
  name: string;
  ownerUid: string;
  createdAt: number; // Unix timestamp in ms or Firestore Timestamp
  profile: EventProfile;
  inviteCode?: string;
}

/**
 * homes/{homeId}/private/budget
 * Readable only by couple + members where canSeeBudget is true.
 */
export interface PrivateBudget {
  total: number; // In INR
  range?: {
    low: number;
    high: number;
  };
  planning_value?: number;
  breakdown_by_category?: Record<string, {
    percent: number;
    amount: number;
  }>;
  breakdown_by_function?: Record<string, {
    percent: number;
    amount: number;
  }>;
  updatedAt: number;
}

/**
 * homes/{homeId}/members/{uid}
 */
export interface Member {
  uid: string;
  name: string;
  relationship: string;
  permission: MemberPermission;
  preferredLanguage: IndianLanguage | string;
  interests: string[];
  canSeeBudget: boolean;
}

/**
 * homes/{homeId}/rooms/{roomId}
 */
export interface Room {
  id: string;
  name: RoomTopic;
  createdAt?: number;
}

/**
 * homes/{homeId}/rooms/{roomId}/messages/{id}
 */
export interface Message {
  id: string;
  authorType: 'member' | 'maya';
  authorUid: string;
  text: string;
  lang: string;
  structured?: any; // Structured envelope payload if message came from Maya
  planPartSaved?: string | null;
  createdAt: number;
}

/**
 * homes/{homeId}/rooms/{roomId}/ideas/{id}
 */
export interface Idea {
  id: string;
  authorUid: string;
  authorName?: string;
  text: string;
  createdAt: number;
}

export type PlanPartSource = 'mock' | 'live';

export interface PlanPartWrapper<T = any> {
  data: T;
  source: PlanPartSource;
  updatedAt: number;
}

/**
 * homes/{homeId}/plan
 */
export interface WeddingPlan {
  budget?: PlanPartWrapper<any> | null;
  timeline?: PlanPartWrapper<any> | null;
  checklist?: PlanPartWrapper<any> | null;
  palette?: PlanPartWrapper<any> | null;
  decor?: PlanPartWrapper<any> | null;
  attire?: PlanPartWrapper<any> | null;
  bookedVendors?: Record<string, boolean>; // vendor_type -> boolean
  version: number;
  updatedAt?: number;
}

/**
 * Decision option in group synthesis
 */
export interface DecisionOption {
  id: string; // e.g. "A", "B", "C"
  name: string;
  what_it_includes: string;
  who_gets_what: Array<{
    member: string;
    gets: string;
  }>;
  cost_tier: '₹' | '₹₹' | '₹₹₹' | string;
  fits_locked_constraints: boolean;
  fits_budget: boolean;
}

/**
 * homes/{homeId}/decisions/{id}
 */
export interface Decision {
  id: string;
  roomId: string;
  topic: string;
  options: DecisionOption[];
  votes: Record<string, string>; // uid -> optionId
  status: DecisionStatus;
  round?: 'first' | 'runoff';
  runoffOptionIds?: [string, string];
  tiedOptionIds?: string[];
  result?: string; // Winning optionId
  decidedBy?: 'majority' | 'runoff_majority' | 'couple' | string;
  closedAt?: number;
}

export interface HomeInvite {
  token: string;
  homeId: string;
  createdBy: string;
  createdAt: number;
  expiresAt: number;
}
