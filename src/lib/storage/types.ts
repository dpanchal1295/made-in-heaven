import {
  Home,
  EventProfile,
  PrivateBudget,
  Member,
  MemberPermission,
  Room,
  Message,
  WeddingPlan,
  Decision,
  HomeInvite,
  Idea,
  UserRecord,
} from '@/types/firestore';
import { ProfileUpdate } from '@/lib/maya/schemas';

export interface PendingConfirmation {
  id: string;
  homeId: string;
  path: string;
  value: any;
  question: string;
  createdAt: number;
}

export interface ApplyUpdatesResult {
  profile: EventProfile;
  budget: PrivateBudget | null;
  applied: ProfileUpdate[];
  rejected: Array<{ update: ProfileUpdate; reason: string }>;
}

export interface ApplyConfirmationResult {
  success: boolean;
  profile?: EventProfile;
  budget?: PrivateBudget | null;
  appliedUpdate?: ProfileUpdate;
  error?: string;
}

export interface IWeddingStorage {
  /**
   * Retrieves the Home record including event profile (no budget)
   */
  getHome(homeId: string): Promise<Home>;

  /**
   * Saves or overwrites a Home record
   */
  saveHome(home: Home): Promise<Home>;

  /**
   * Retrieves the private budget for a home (null if non-existent)
   */
  getBudget(homeId: string): Promise<PrivateBudget | null>;

  /**
   * Saves or overwrites the private budget for a home
   */
  saveBudget(homeId: string, budget: PrivateBudget): Promise<PrivateBudget>;

  /**
   * Retrieves the current speaker / member profile
   */
  getSpeaker(homeId: string, uid?: string): Promise<Member>;

  /**
   * Loads recent messages for a room
   */
  getRecentMessages(homeId: string, roomId: string, limit?: number): Promise<Message[]>;

  /**
   * Adds a message to a room's history
   */
  addMessage(
    homeId: string,
    roomId: string,
    message: Omit<Message, 'id' | 'createdAt'>
  ): Promise<Message>;

  /**
   * Applies validated profile updates only if speaker permission permits the path
   */
  applyProfileUpdates(
    homeId: string,
    updates: ProfileUpdate[],
    speakerPermission: MemberPermission
  ): Promise<ApplyUpdatesResult>;

  /**
   * Stores a server-side pending confirmation item with a secure ID
   */
  savePendingConfirmation(
    homeId: string,
    confirmation: Omit<PendingConfirmation, 'id' | 'createdAt'>
  ): Promise<PendingConfirmation>;

  /**
   * Retrieves a pending confirmation by ID
   */
  getPendingConfirmation(
    homeId: string,
    confirmationId: string
  ): Promise<PendingConfirmation | null>;

  /**
   * Retrieves all active pending confirmations for a home
   */
  getPendingConfirmations(homeId: string): Promise<PendingConfirmation[]>;

  /**
   * Confirms and applies a pending confirmation by ID, re-checking path and permissions server-side
   */
  applyConfirmation(
    homeId: string,
    confirmationId: string,
    speakerPermission: MemberPermission
  ): Promise<ApplyConfirmationResult>;

  /**
   * Dismisses/rejects a pending confirmation
   */
  rejectConfirmation(homeId: string, confirmationId: string): Promise<boolean>;

  /**
   * Resets demo data to initial onboarding state
   */
  resetDemoData(homeId: string): Promise<{ profile: EventProfile; budget: PrivateBudget }>;

  /**
   * Retrieves the current wedding plan for a home
   */
  getPlan(homeId: string): Promise<WeddingPlan | null>;

  /**
   * Saves or updates the complete wedding plan
   */
  savePlan(homeId: string, plan: WeddingPlan): Promise<WeddingPlan>;

  /**
   * Saves or updates a specific part of the wedding plan (budget, timeline, checklist, palette, decor, attire)
   */
  savePlanPart(
    homeId: string,
    part: 'budget' | 'timeline' | 'checklist' | 'palette' | 'decor' | 'attire',
    data: any,
    source?: 'mock' | 'live'
  ): Promise<WeddingPlan>;

  /**
   * Toggles the booked status of a checklist vendor item
   */
  toggleChecklistItem(
    homeId: string,
    vendorType: string,
    booked: boolean
  ): Promise<WeddingPlan>;

  /**
   * Clears all plan parts and checklist ticks for a home
   */
  clearPlan(homeId: string): Promise<WeddingPlan>;

  /**
   * Retrieves all members belonging to a home
   */
  getMembers(homeId: string): Promise<Member[]>;

  /**
   * Finds a home by its invite code (e.g. MIH-2026)
   */
  getHomeByInviteCode(inviteCode: string): Promise<Home | null>;

  /**
   * Creates a new Home with couple details, initial event profile, and default owner member
   */
  createHomeWithDetails(details: {
    coupleNames: string;
    date?: string;
    city?: string;
    ownerUid: string;
    ownerName: string;
    preferredLanguage?: string;
    eventType?: 'wedding' | 'birthday' | 'community';
    eventSubtype?: string;
  }): Promise<{ home: Home; member: Member }>;

  /**
   * Retrieves all rooms in a home
   */
  getRooms(homeId: string): Promise<Room[]>;

  /**
   * Loads ideas for a room
   */
  getIdeas(homeId: string, roomId: string, since?: number): Promise<Idea[]>;

  /**
   * Adds an idea to a room
   */
  addIdea(
    homeId: string,
    roomId: string,
    idea: Omit<Idea, 'id' | 'createdAt'>
  ): Promise<Idea>;

  /**
   * Retrieves decisions for a home
   */
  getDecisions(homeId: string): Promise<Decision[]>;

  /**
   * Retrieves a decision by ID
   */
  getDecision(homeId: string, decisionId: string): Promise<Decision | null>;

  /**
   * Saves or updates a decision
   */
  saveDecision(homeId: string, decision: Decision): Promise<Decision>;

  /**
   * Creates an invite for a home
   */
  createInvite(invite: HomeInvite): Promise<HomeInvite>;

  /**
   * Finds an invite by token
   */
  getInvite(token: string): Promise<HomeInvite | null>;

  /**
   * Deletes or consumes an invite
   */
  deleteInvite(token: string): Promise<void>;

  /**
   * Adds or registers a member in a home
   */
  addMemberToHome(homeId: string, member: Member): Promise<Member>;

  /**
   * Updates an existing member's properties (e.g. preferredLanguage, canSeeBudget)
   */
  updateMember(homeId: string, uid: string, updates: Partial<Member>): Promise<Member>;

  /**
   * Updates communication style on event profile
   */
  updateCommunicationStyle(
    homeId: string,
    honestyPreference: 'gentle' | 'balanced' | 'straight-to-the-point'
  ): Promise<EventProfile>;

  /**
   * Retrieves a User record by UID
   */
  getUser(uid: string): Promise<UserRecord | null>;

  /**
   * Saves or updates a User record
   */
  saveUser(user: UserRecord): Promise<UserRecord>;

  /**
   * Fully resets demo state to the canonical Aarav & Diya demo fixtures
   */
  resetAllDemoData(): Promise<void>;
}
