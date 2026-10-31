import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import {
  Home,
  EventProfile,
  PrivateBudget,
  Member,
  MemberPermission,
  Message,
  WeddingPlan,
  Room,
  Idea,
  Decision,
  HomeInvite,
  UserRecord,
} from '@/types/firestore';
import { ProfileUpdate } from '@/lib/maya/schemas';
import { parseRangeAndPlanningValue } from '@/lib/utils/format';
import {
  IWeddingStorage,
  PendingConfirmation,
  ApplyUpdatesResult,
  ApplyConfirmationResult,
} from './types';

interface StorageSchema {
  homes: Record<string, Home>;
  budgets: Record<string, PrivateBudget>;
  members: Record<string, Record<string, Member>>; // homeId -> uid -> Member
  rooms: Record<string, Room[]>; // homeId -> Room[]
  messages: Record<string, Record<string, Message[]>>; // homeId -> roomId -> Message[]
  ideas: Record<string, Record<string, Idea[]>>; // homeId -> roomId -> Idea[]
  decisions: Record<string, Record<string, Decision>>; // homeId -> decisionId -> Decision
  invites: Record<string, HomeInvite>; // token -> HomeInvite
  pendingConfirmations: Record<string, Record<string, PendingConfirmation>>; // homeId -> id -> PendingConfirmation
  plans: Record<string, WeddingPlan>; // homeId -> WeddingPlan
  users: Record<string, UserRecord>; // uid -> UserRecord
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'wedding_state.json');

const DEFAULT_HOME_ID = 'demo-home-1';
const DEFAULT_SPEAKER_UID = 'demo-aarav-1';
const DEFAULT_ROOM_ID = 'onboarding';

const DEFAULT_ROOM_NAMES = ['Venue', 'Food', 'Outfits', 'Decor', 'Budget', 'General'];

export class LocalWeddingStorage implements IWeddingStorage {
  private inMemoryCache: StorageSchema | null = null;
  private writeLock: Promise<void> = Promise.resolve();
  private isFilesystemWritable: boolean = true;

  private async ensureInitialized(): Promise<StorageSchema> {
    if (this.inMemoryCache) {
      this.ensureSchemaIntegrity(this.inMemoryCache);
      return this.inMemoryCache;
    }

    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      const rawData = await fs.readFile(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(rawData);
      this.ensureSchemaIntegrity(parsed);
      this.inMemoryCache = parsed;
      return this.inMemoryCache!;
    } catch {
      // In-memory fallback if file doesn't exist or directory isn't writable
      const initialData = this.createInitialSeedData();
      this.inMemoryCache = initialData;
      await this.persist();
      return this.inMemoryCache;
    }
  }

  private ensureSchemaIntegrity(schema: StorageSchema): void {
    if (!schema.homes) schema.homes = {};
    if (!schema.budgets) schema.budgets = {};
    if (!schema.members) schema.members = {};
    if (!schema.rooms) schema.rooms = {};
    if (!schema.messages) schema.messages = {};
    if (!schema.ideas) schema.ideas = {};
    if (!schema.decisions) schema.decisions = {};
    if (!schema.invites) schema.invites = {};
    if (!schema.pendingConfirmations) schema.pendingConfirmations = {};
    if (!schema.plans) schema.plans = {};
    if (!schema.users) schema.users = {};

    if (schema.members && schema.members[DEFAULT_HOME_ID]) {
      // Clean up legacy combined member if present
      if (schema.members[DEFAULT_HOME_ID]['demo-couple-1']) {
        delete schema.members[DEFAULT_HOME_ID]['demo-couple-1'];
      }
    }

    if (!schema.members[DEFAULT_HOME_ID]) {
      const seed = this.createInitialSeedData();
      schema.members[DEFAULT_HOME_ID] = seed.members[DEFAULT_HOME_ID];
    }
    if (!schema.rooms[DEFAULT_HOME_ID] || schema.rooms[DEFAULT_HOME_ID].length === 0) {
      const seed = this.createInitialSeedData();
      schema.rooms[DEFAULT_HOME_ID] = seed.rooms[DEFAULT_HOME_ID];
    }
    if (schema.homes && schema.homes[DEFAULT_HOME_ID] && !schema.homes[DEFAULT_HOME_ID].inviteCode) {
      schema.homes[DEFAULT_HOME_ID].inviteCode = 'MIH-2026';
    }
    if (schema.homes && schema.homes[DEFAULT_HOME_ID] && !schema.homes[DEFAULT_HOME_ID].profile.eventType) {
      schema.homes[DEFAULT_HOME_ID].profile.eventType = 'wedding';
    }
  }

  private createInitialSeedData(): StorageSchema {
    const now = Date.now();
    return {
      homes: {
        [DEFAULT_HOME_ID]: {
          id: DEFAULT_HOME_ID,
          name: 'Aarav and Diya',
          ownerUid: 'demo-aarav-1',
          createdAt: now,
          inviteCode: 'MIH-2026',
          profile: {
            eventType: 'wedding',
            date: '2026-12-18',
            city: 'Pune',
            guest_count: {
              estimate: 300,
              range: { low: 250, high: 350 },
              planning_value: 300,
              per_function: {
                'Mehendi': 150,
                'Sangeet': 250,
                'Haldi': 120,
                'Wedding Ceremony': 300,
                'Reception': 300,
              },
            },
            culture: ['Maharashtrian', 'Gujarati'],
            vibe: 'Warm, elegant fusion celebration',
            functions: ['Mehendi', 'Sangeet', 'Haldi', 'Wedding Ceremony', 'Reception'],
            locked_constraints: ['300 guests', 'Luxury garden resort venue in Pune'],
            communication_style: {
              honesty_preference: 'balanced',
            },
          },
        },
      },
      budgets: {
        [DEFAULT_HOME_ID]: {
          total: 800000,
          planning_value: 800000,
          range: { low: 700000, high: 900000 },
          updatedAt: now,
        },
      },
      members: {
        [DEFAULT_HOME_ID]: {
          'demo-aarav-1': {
            uid: 'demo-aarav-1',
            name: 'Aarav',
            relationship: 'couple',
            permission: 'couple',
            preferredLanguage: 'en',
            interests: ['venue', 'decor', 'food', 'budget'],
            canSeeBudget: true,
          },
          'demo-diya-1': {
            uid: 'demo-diya-1',
            name: 'Diya',
            relationship: 'couple',
            permission: 'couple',
            preferredLanguage: 'en',
            interests: ['outfits', 'decor', 'palette', 'budget'],
            canSeeBudget: true,
          },
          'demo-mother-1': {
            uid: 'demo-mother-1',
            name: "Meenakshi (Diya's Mother)",
            relationship: 'mother',
            permission: 'voter',
            preferredLanguage: 'gu',
            interests: ['decor', 'food', 'rituals'],
            canSeeBudget: true,
          },
          'demo-brother-1': {
            uid: 'demo-brother-1',
            name: "Kabir (Aarav's Brother)",
            relationship: 'brother',
            permission: 'advisor',
            preferredLanguage: 'hi',
            interests: ['music', 'venue', 'sangeet'],
            canSeeBudget: false,
          },
          'demo-friend-1': {
            uid: 'demo-friend-1',
            name: "Rhea (Diya's Friend)",
            relationship: 'friend',
            permission: 'viewer',
            preferredLanguage: 'en',
            interests: ['outfits', 'photos'],
            canSeeBudget: false,
          },
        },
      },
      rooms: {
        [DEFAULT_HOME_ID]: DEFAULT_ROOM_NAMES.map((name) => ({
          id: name.toLowerCase(),
          name,
          createdAt: now,
        })),
      },
      messages: {
        [DEFAULT_HOME_ID]: {
          [DEFAULT_ROOM_ID]: [],
          venue: [],
          food: [],
          outfits: [],
          decor: [],
          budget: [],
          general: [],
        },
      },
      ideas: {
        [DEFAULT_HOME_ID]: {
          venue: [
            {
              id: 'idea-venue-1',
              authorUid: 'demo-aarav-1',
              authorName: 'Aarav',
              text: 'Open-air heritage lawn near Koregaon Park with banyan trees and lantern lighting',
              createdAt: now - 3600000,
            },
            {
              id: 'idea-venue-2',
              authorUid: 'demo-mother-1',
              authorName: "Meenakshi (Diya's Mother)",
              text: 'Resort banquet with an indoor AC hall for elders and outdoor courtyard for pheras',
              createdAt: now - 2400000,
            },
            {
              id: 'idea-venue-3',
              authorUid: 'demo-brother-1',
              authorName: "Kabir (Aarav's Brother)",
              text: 'Poolside lawn with separate dance deck for late night sangeet & DJ setup',
              createdAt: now - 1200000,
            },
          ],
          decor: [
            {
              id: 'idea-decor-1',
              authorUid: 'demo-diya-1',
              authorName: 'Diya',
              text: 'Terracotta pots, brass urlis with marigold florals, and sustainable handmade paper signage',
              createdAt: now - 3000000,
            },
            {
              id: 'idea-decor-2',
              authorUid: 'demo-mother-1',
              authorName: "Meenakshi (Diya's Mother)",
              text: 'Traditional yellow and orange genda phool draping with mogra scented canopies for pheras',
              createdAt: now - 2000000,
            },
          ],
        },
      },
      decisions: {
        [DEFAULT_HOME_ID]: {},
      },
      invites: {},
      pendingConfirmations: {
        [DEFAULT_HOME_ID]: {},
      },
      plans: {},
      users: {},
    };
  }

  private async persist(): Promise<void> {
    if (!this.inMemoryCache) return;
    if (!this.isFilesystemWritable) return;

    this.writeLock = this.writeLock.then(async () => {
      try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        const tempFile = `${DATA_FILE}.tmp.${Date.now()}`;
        await fs.writeFile(tempFile, JSON.stringify(this.inMemoryCache, null, 2), 'utf-8');
        await fs.rename(tempFile, DATA_FILE);
      } catch (err) {
        // Fall back gracefully to in-memory mode if filesystem is read-only (e.g. Vercel)
        this.isFilesystemWritable = false;
        console.warn('LocalWeddingStorage: Filesystem is read-only. Falling back to in-memory storage.', err);
      }
    });

    await this.writeLock;
  }

  async getHome(homeId: string = DEFAULT_HOME_ID): Promise<Home> {
    const data = await this.ensureInitialized();
    if (!data.homes[homeId]) {
      data.homes[homeId] = {
        id: homeId,
        name: 'Our Celebration',
        ownerUid: DEFAULT_SPEAKER_UID,
        createdAt: Date.now(),
        profile: { eventType: 'wedding' },
      };
      await this.persist();
    }
    return JSON.parse(JSON.stringify(data.homes[homeId]));
  }

  async saveHome(home: Home): Promise<Home> {
    const data = await this.ensureInitialized();
    data.homes[home.id] = { ...home };
    await this.persist();
    return JSON.parse(JSON.stringify(home));
  }

  async getBudget(homeId: string = DEFAULT_HOME_ID): Promise<PrivateBudget | null> {
    const data = await this.ensureInitialized();
    const budget = data.budgets[homeId];
    return budget ? JSON.parse(JSON.stringify(budget)) : null;
  }

  async saveBudget(homeId: string, budget: PrivateBudget): Promise<PrivateBudget> {
    const data = await this.ensureInitialized();
    if (!data.budgets) data.budgets = {};
    data.budgets[homeId] = { ...budget };
    await this.persist();
    return JSON.parse(JSON.stringify(budget));
  }

  async getSpeaker(homeId: string = DEFAULT_HOME_ID, uid: string = DEFAULT_SPEAKER_UID): Promise<Member> {
    const data = await this.ensureInitialized();
    const homeMembers = (data.members && data.members[homeId]) || {};
    const member = homeMembers[uid];
    if (member) {
      return JSON.parse(JSON.stringify(member));
    }

    if (homeId === DEFAULT_HOME_ID) {
      const seed = this.createInitialSeedData();
      if (seed.members[DEFAULT_HOME_ID]?.[uid]) {
        if (!data.members) data.members = {};
        if (!data.members[DEFAULT_HOME_ID]) data.members[DEFAULT_HOME_ID] = {};
        data.members[DEFAULT_HOME_ID][uid] = seed.members[DEFAULT_HOME_ID][uid];
        return JSON.parse(JSON.stringify(data.members[DEFAULT_HOME_ID][uid]));
      }
    }

    return {
      uid,
      name: 'Guest Member',
      relationship: 'family',
      permission: 'viewer',
      preferredLanguage: 'en',
      interests: [],
      canSeeBudget: false,
    };
  }

  async getMembers(homeId: string = DEFAULT_HOME_ID): Promise<Member[]> {
    const data = await this.ensureInitialized();
    if (!data.members) data.members = {};
    const homeMembers = data.members[homeId];
    if (!homeMembers) {
      if (homeId === DEFAULT_HOME_ID) {
        const seed = this.createInitialSeedData();
        data.members[DEFAULT_HOME_ID] = seed.members[DEFAULT_HOME_ID];
        return Object.values(data.members[DEFAULT_HOME_ID]);
      }
      return [];
    }
    return Object.values(homeMembers);
  }

  async getRecentMessages(
    homeId: string = DEFAULT_HOME_ID,
    roomId: string = DEFAULT_ROOM_ID,
    limit: number = 20
  ): Promise<Message[]> {
    const data = await this.ensureInitialized();
    const roomMessages = (data.messages && data.messages[homeId] && data.messages[homeId][roomId]) || [];
    return JSON.parse(JSON.stringify(roomMessages.slice(-limit)));
  }

  async addMessage(
    homeId: string = DEFAULT_HOME_ID,
    roomId: string = DEFAULT_ROOM_ID,
    message: Omit<Message, 'id' | 'createdAt'>
  ): Promise<Message> {
    const data = await this.ensureInitialized();
    if (!data.messages) data.messages = {};
    if (!data.messages[homeId]) data.messages[homeId] = {};
    if (!data.messages[homeId][roomId]) data.messages[homeId][roomId] = [];

    const newMessage: Message = {
      ...message,
      id: `msg_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      createdAt: Date.now(),
    };

    data.messages[homeId][roomId].push(newMessage);
    await this.persist();
    return JSON.parse(JSON.stringify(newMessage));
  }

  async applyProfileUpdates(
    homeId: string = DEFAULT_HOME_ID,
    updates: ProfileUpdate[],
    speakerPermission: MemberPermission
  ): Promise<ApplyUpdatesResult> {
    const data = await this.ensureInitialized();
    const home = await this.getHome(homeId);
    let budget = await this.getBudget(homeId);

    const applied: ProfileUpdate[] = [];
    const rejected: Array<{ update: ProfileUpdate; reason: string }> = [];

    for (const update of updates) {
      const { path: p, value } = update;

      if (p.startsWith('budget.')) {
        if (speakerPermission !== 'couple') {
          rejected.push({ update, reason: 'Only the couple can modify the budget.' });
          continue;
        }

        if (!budget) {
          budget = { total: 0, updatedAt: Date.now() };
          data.budgets[homeId] = budget;
        }

        if (p === 'budget.total') {
          if (typeof value === 'number') {
            budget.total = value;
            budget.planning_value = value;
          } else if (typeof value === 'string') {
            const parsed = parseRangeAndPlanningValue(value, true);
            if (parsed) {
              budget.total = parsed.planning_value;
              budget.planning_value = parsed.planning_value;
              budget.range = { low: parsed.low, high: parsed.high };
            }
          }
          budget.updatedAt = Date.now();
          applied.push(update);
        } else if (p === 'budget.range') {
          if (typeof value === 'string') {
            const parsed = parseRangeAndPlanningValue(value, true);
            if (parsed) {
              budget.range = { low: parsed.low, high: parsed.high };
              budget.total = parsed.planning_value;
              budget.planning_value = parsed.planning_value;
              budget.updatedAt = Date.now();
              applied.push(update);
            }
          } else if (typeof value === 'object' && value !== null && 'low' in value && 'high' in value) {
            const vObj = value as { low: number; high: number };
            budget.range = { low: Number(vObj.low), high: Number(vObj.high) };
            budget.planning_value = Math.round((budget.range.low + budget.range.high) / 2);
            budget.total = budget.planning_value;
            budget.updatedAt = Date.now();
            applied.push(update);
          }
        }
        continue;
      }

      if (p === 'locked_constraints' || p.startsWith('locked_constraints.')) {
        if (speakerPermission !== 'couple') {
          rejected.push({ update, reason: 'Only the couple can modify locked constraints.' });
          continue;
        }
      }

      if (!home.profile) home.profile = {};

      if (p === 'guest_count' || p === 'guest_count.estimate') {
        if (typeof value === 'number') {
          home.profile.guest_count = {
            ...home.profile.guest_count,
            estimate: value,
            planning_value: value,
          };
          applied.push(update);
        } else if (typeof value === 'string') {
          const parsed = parseRangeAndPlanningValue(value, false);
          if (parsed) {
            home.profile.guest_count = {
              ...home.profile.guest_count,
              estimate: parsed.planning_value,
              planning_value: parsed.planning_value,
              range: { low: parsed.low, high: parsed.high },
            };
            applied.push(update);
          }
        }
      } else if (p === 'guest_count.range') {
        if (typeof value === 'string') {
          const parsed = parseRangeAndPlanningValue(value, false);
          if (parsed) {
            home.profile.guest_count = {
              ...home.profile.guest_count,
              range: { low: parsed.low, high: parsed.high },
              planning_value: parsed.planning_value,
              estimate: parsed.planning_value,
            };
            applied.push(update);
          }
        } else if (typeof value === 'object' && value !== null && 'low' in value && 'high' in value) {
          const rangeObj = { low: Number((value as any).low), high: Number((value as any).high) };
          const planningVal = Math.round((rangeObj.low + rangeObj.high) / 2);
          home.profile.guest_count = {
            ...home.profile.guest_count,
            range: rangeObj,
            planning_value: planningVal,
            estimate: planningVal,
          };
          applied.push(update);
        }
      } else if (p === 'date') {
        home.profile.date = String(value);
        applied.push(update);
      } else if (p === 'city') {
        home.profile.city = String(value);
        applied.push(update);
      } else if (p === 'eventType') {
        home.profile.eventType = value as any;
        applied.push(update);
      } else if (p === 'eventSubtype') {
        home.profile.eventSubtype = String(value);
        applied.push(update);
      } else if (p === 'vibe') {
        home.profile.vibe = String(value);
        applied.push(update);
      } else if (p === 'culture') {
        const arr = Array.isArray(value) ? value.map(String) : [String(value)];
        home.profile.culture = Array.from(new Set([...(home.profile.culture || []), ...arr]));
        applied.push(update);
      } else if (p === 'functions') {
        const arr = Array.isArray(value) ? value.map(String) : [String(value)];
        home.profile.functions = Array.from(new Set([...(home.profile.functions || []), ...arr]));
        applied.push(update);
      } else if (p === 'locked_constraints') {
        const arr = Array.isArray(value) ? value.map(String) : [String(value)];
        home.profile.locked_constraints = Array.from(new Set([...(home.profile.locked_constraints || []), ...arr]));
        applied.push(update);
      } else if (p === 'communication_style.honesty_preference') {
        if (!home.profile.communication_style) home.profile.communication_style = {};
        home.profile.communication_style.honesty_preference = value as any;
        applied.push(update);
      } else {
        applied.push(update);
      }
    }

    data.homes[homeId] = home;
    if (budget) data.budgets[homeId] = budget;
    await this.persist();

    return {
      profile: JSON.parse(JSON.stringify(home.profile)),
      budget: budget ? JSON.parse(JSON.stringify(budget)) : null,
      applied,
      rejected,
    };
  }

  async savePendingConfirmation(
    homeId: string = DEFAULT_HOME_ID,
    confirmation: Omit<PendingConfirmation, 'id' | 'createdAt'>
  ): Promise<PendingConfirmation> {
    const data = await this.ensureInitialized();
    if (!data.pendingConfirmations) data.pendingConfirmations = {};
    if (!data.pendingConfirmations[homeId]) data.pendingConfirmations[homeId] = {};

    const id = `conf_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const newConf: PendingConfirmation = {
      ...confirmation,
      id,
      createdAt: Date.now(),
    };

    data.pendingConfirmations[homeId][id] = newConf;
    await this.persist();
    return JSON.parse(JSON.stringify(newConf));
  }

  async getPendingConfirmation(
    homeId: string = DEFAULT_HOME_ID,
    confirmationId: string
  ): Promise<PendingConfirmation | null> {
    const data = await this.ensureInitialized();
    const conf = data.pendingConfirmations?.[homeId]?.[confirmationId];
    return conf ? JSON.parse(JSON.stringify(conf)) : null;
  }

  async getPendingConfirmations(homeId: string = DEFAULT_HOME_ID): Promise<PendingConfirmation[]> {
    const data = await this.ensureInitialized();
    const confs = data.pendingConfirmations?.[homeId] || {};
    return Object.values(confs);
  }

  async applyConfirmation(
    homeId: string = DEFAULT_HOME_ID,
    confirmationId: string,
    speakerPermission: MemberPermission
  ): Promise<ApplyConfirmationResult> {
    const data = await this.ensureInitialized();
    const conf = data.pendingConfirmations?.[homeId]?.[confirmationId];
    if (!conf) {
      return { success: false, error: 'Confirmation request not found or already processed.' };
    }

    const update: ProfileUpdate = {
      path: conf.path,
      value: conf.value,
      action: 'set',
      reason: 'User confirmed pending update',
    };
    const result = await this.applyProfileUpdates(homeId, [update], speakerPermission);

    if (result.rejected.length > 0) {
      return { success: false, error: result.rejected[0].reason };
    }

    delete data.pendingConfirmations[homeId][confirmationId];
    await this.persist();

    return {
      success: true,
      profile: result.profile,
      budget: result.budget,
      appliedUpdate: update,
    };
  }

  async rejectConfirmation(homeId: string = DEFAULT_HOME_ID, confirmationId: string): Promise<boolean> {
    const data = await this.ensureInitialized();
    if (data.pendingConfirmations?.[homeId]?.[confirmationId]) {
      delete data.pendingConfirmations[homeId][confirmationId];
      await this.persist();
      return true;
    }
    return false;
  }

  async resetDemoData(homeId: string = DEFAULT_HOME_ID): Promise<{ profile: EventProfile; budget: PrivateBudget }> {
    const seed = this.createInitialSeedData();
    const data = await this.ensureInitialized();

    data.homes[homeId] = seed.homes[DEFAULT_HOME_ID];
    data.budgets[homeId] = seed.budgets[DEFAULT_HOME_ID];
    data.members[homeId] = seed.members[DEFAULT_HOME_ID];
    data.rooms[homeId] = seed.rooms[DEFAULT_HOME_ID];
    data.messages[homeId] = seed.messages[DEFAULT_HOME_ID];
    data.ideas[homeId] = seed.ideas[DEFAULT_HOME_ID];
    data.decisions[homeId] = seed.decisions[DEFAULT_HOME_ID];
    data.pendingConfirmations[homeId] = {};
    data.plans[homeId] = {
      budget: null,
      timeline: null,
      checklist: null,
      palette: null,
      decor: null,
      attire: null,
      bookedVendors: {},
      version: 0,
      updatedAt: Date.now(),
    };

    await this.persist();
    return {
      profile: JSON.parse(JSON.stringify(data.homes[homeId].profile)),
      budget: JSON.parse(JSON.stringify(data.budgets[homeId])),
    };
  }

  async getPlan(homeId: string = DEFAULT_HOME_ID): Promise<WeddingPlan | null> {
    const data = await this.ensureInitialized();
    const plan = data.plans?.[homeId];
    return plan ? JSON.parse(JSON.stringify(plan)) : null;
  }

  async savePlan(homeId: string = DEFAULT_HOME_ID, plan: WeddingPlan): Promise<WeddingPlan> {
    const data = await this.ensureInitialized();
    if (!data.plans) data.plans = {};
    data.plans[homeId] = {
      ...plan,
      updatedAt: Date.now(),
      version: (plan.version || 0) + 1,
    };
    await this.persist();
    return JSON.parse(JSON.stringify(data.plans[homeId]));
  }

  async savePlanPart(
    homeId: string = DEFAULT_HOME_ID,
    part: 'budget' | 'timeline' | 'checklist' | 'palette' | 'decor' | 'attire',
    partData: unknown,
    source: 'mock' | 'live' = 'mock'
  ): Promise<WeddingPlan> {
    const data = await this.ensureInitialized();
    if (!data.plans) data.plans = {};
    const existing = data.plans[homeId] || {
      budget: null,
      timeline: null,
      checklist: null,
      palette: null,
      decor: null,
      attire: null,
      bookedVendors: {},
      version: 0,
      updatedAt: Date.now(),
    };

    const updatedPlan: WeddingPlan = {
      ...existing,
      [part]: {
        data: partData,
        source,
        updatedAt: Date.now(),
      },
      version: (existing.version || 0) + 1,
      updatedAt: Date.now(),
    };

    data.plans[homeId] = updatedPlan;
    await this.persist();
    return JSON.parse(JSON.stringify(updatedPlan));
  }

  async toggleChecklistItem(
    homeId: string = DEFAULT_HOME_ID,
    vendorType: string,
    booked: boolean
  ): Promise<WeddingPlan> {
    const data = await this.ensureInitialized();
    if (!data.plans) data.plans = {};
    const plan = data.plans[homeId] || {
      budget: null,
      timeline: null,
      checklist: null,
      palette: null,
      decor: null,
      attire: null,
      bookedVendors: {},
      version: 0,
      updatedAt: Date.now(),
    };

    if (!plan.bookedVendors) plan.bookedVendors = {};
    plan.bookedVendors[vendorType] = booked;
    plan.updatedAt = Date.now();
    data.plans[homeId] = plan;
    await this.persist();
    return JSON.parse(JSON.stringify(plan));
  }

  async clearPlan(homeId: string = DEFAULT_HOME_ID): Promise<WeddingPlan> {
    const data = await this.ensureInitialized();
    if (!data.plans) data.plans = {};
    const cleared: WeddingPlan = {
      budget: null,
      timeline: null,
      checklist: null,
      palette: null,
      decor: null,
      attire: null,
      bookedVendors: {},
      version: 0,
      updatedAt: Date.now(),
    };
    data.plans[homeId] = cleared;
    await this.persist();
    return JSON.parse(JSON.stringify(cleared));
  }

  async getHomeByInviteCode(inviteCode: string): Promise<Home | null> {
    const data = await this.ensureInitialized();
    const homes = Object.values(data.homes || {});
    const match = homes.find(
      (h) => h.inviteCode && h.inviteCode.trim().toUpperCase() === inviteCode.trim().toUpperCase()
    );
    return match ? JSON.parse(JSON.stringify(match)) : null;
  }

  async createHomeWithDetails(details: {
    coupleNames: string;
    date?: string;
    city?: string;
    ownerUid: string;
    ownerName: string;
    preferredLanguage?: string;
    eventType?: 'wedding' | 'birthday' | 'community';
    eventSubtype?: string;
  }): Promise<{ home: Home; member: Member }> {
    const data = await this.ensureInitialized();
    const now = Date.now();
    const homeId = `home_${now}_${crypto.randomBytes(3).toString('hex')}`;
    const inviteCode = `MIH-${Math.floor(1000 + Math.random() * 9000)}`;

    const newHome: Home = {
      id: homeId,
      name: details.coupleNames.trim(),
      ownerUid: details.ownerUid,
      createdAt: now,
      inviteCode,
      profile: {
        eventType: details.eventType || 'wedding',
        eventSubtype: details.eventSubtype || '',
        date: details.date || '',
        city: details.city || '',
        guest_count: {},
        culture: [],
        functions: [],
        locked_constraints: [],
        communication_style: {
          honesty_preference: 'balanced',
        },
      },
    };

    const ownerMember: Member = {
      uid: details.ownerUid,
      name: details.ownerName || details.coupleNames,
      relationship: 'couple',
      permission: 'couple',
      preferredLanguage: details.preferredLanguage || 'en',
      interests: ['venue', 'decor', 'food', 'budget'],
      canSeeBudget: true,
    };

    data.homes[homeId] = newHome;
    data.budgets[homeId] = {
      total: 0,
      updatedAt: now,
    };
    data.members[homeId] = {
      [details.ownerUid]: ownerMember,
    };
    data.rooms[homeId] = DEFAULT_ROOM_NAMES.map((name) => ({
      id: name.toLowerCase(),
      name,
      createdAt: now,
    }));
    data.messages[homeId] = {
      [DEFAULT_ROOM_ID]: [],
    };
    data.ideas[homeId] = {};
    data.decisions[homeId] = {};
    data.pendingConfirmations[homeId] = {};
    data.plans[homeId] = {
      budget: null,
      timeline: null,
      checklist: null,
      palette: null,
      decor: null,
      attire: null,
      bookedVendors: {},
      version: 0,
      updatedAt: now,
    };

    await this.persist();
    return {
      home: JSON.parse(JSON.stringify(newHome)),
      member: JSON.parse(JSON.stringify(ownerMember)),
    };
  }

  async addMemberToHome(homeId: string, member: Member): Promise<Member> {
    const data = await this.ensureInitialized();
    if (!data.members[homeId]) {
      data.members[homeId] = {};
    }
    data.members[homeId][member.uid] = { ...member };
    await this.persist();
    return JSON.parse(JSON.stringify(member));
  }

  async updateMember(homeId: string, uid: string, updates: Partial<Member>): Promise<Member> {
    const data = await this.ensureInitialized();
    if (!data.members[homeId] || !data.members[homeId][uid]) {
      throw new Error(`Member ${uid} not found in home ${homeId}`);
    }

    const current = data.members[homeId][uid];
    const updated = {
      ...current,
      ...updates,
      uid, // UID is immutable
    };
    data.members[homeId][uid] = updated;
    await this.persist();
    return JSON.parse(JSON.stringify(updated));
  }

  async updateCommunicationStyle(
    homeId: string,
    honestyPreference: 'gentle' | 'balanced' | 'straight-to-the-point'
  ): Promise<EventProfile> {
    const data = await this.ensureInitialized();
    if (!data.homes[homeId]) {
      throw new Error(`Home ${homeId} not found`);
    }
    if (!data.homes[homeId].profile) {
      data.homes[homeId].profile = {};
    }
    data.homes[homeId].profile.communication_style = {
      honesty_preference: honestyPreference,
    };
    await this.persist();
    return JSON.parse(JSON.stringify(data.homes[homeId].profile));
  }

  async getRooms(homeId: string): Promise<Room[]> {
    const data = await this.ensureInitialized();
    const rooms = data.rooms?.[homeId] || [];
    return JSON.parse(JSON.stringify(rooms));
  }

  async getIdeas(homeId: string, roomId: string, since?: number): Promise<Idea[]> {
    const data = await this.ensureInitialized();
    let ideas = data.ideas?.[homeId]?.[roomId] || [];
    if (since !== undefined) {
      ideas = ideas.filter((i) => i.createdAt > since);
    }
    return JSON.parse(JSON.stringify(ideas));
  }

  async addIdea(
    homeId: string,
    roomId: string,
    idea: Omit<Idea, 'id' | 'createdAt'>
  ): Promise<Idea> {
    const data = await this.ensureInitialized();
    if (!data.ideas) data.ideas = {};
    if (!data.ideas[homeId]) data.ideas[homeId] = {};
    if (!data.ideas[homeId][roomId]) data.ideas[homeId][roomId] = [];

    const newIdea: Idea = {
      ...idea,
      id: `idea_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      createdAt: Date.now(),
    };

    data.ideas[homeId][roomId].push(newIdea);
    await this.persist();
    return JSON.parse(JSON.stringify(newIdea));
  }

  async getDecisions(homeId: string): Promise<Decision[]> {
    const data = await this.ensureInitialized();
    const decisions = Object.values(data.decisions?.[homeId] || {});
    return JSON.parse(JSON.stringify(decisions));
  }

  async getDecision(homeId: string, decisionId: string): Promise<Decision | null> {
    const data = await this.ensureInitialized();
    const dec = data.decisions?.[homeId]?.[decisionId];
    return dec ? JSON.parse(JSON.stringify(dec)) : null;
  }

  async saveDecision(homeId: string, decision: Decision): Promise<Decision> {
    const data = await this.ensureInitialized();
    if (!data.decisions) data.decisions = {};
    if (!data.decisions[homeId]) data.decisions[homeId] = {};

    data.decisions[homeId][decision.id] = { ...decision };
    await this.persist();
    return JSON.parse(JSON.stringify(decision));
  }

  async createInvite(invite: HomeInvite): Promise<HomeInvite> {
    const data = await this.ensureInitialized();
    if (!data.invites) data.invites = {};
    data.invites[invite.token] = { ...invite };
    await this.persist();
    return JSON.parse(JSON.stringify(invite));
  }

  async getInvite(token: string): Promise<HomeInvite | null> {
    const data = await this.ensureInitialized();
    const inv = data.invites?.[token];
    return inv ? JSON.parse(JSON.stringify(inv)) : null;
  }

  async deleteInvite(token: string): Promise<void> {
    const data = await this.ensureInitialized();
    if (data.invites?.[token]) {
      delete data.invites[token];
      await this.persist();
    }
  }

  async getUser(uid: string): Promise<UserRecord | null> {
    const data = await this.ensureInitialized();
    const user = data.users?.[uid];
    return user ? JSON.parse(JSON.stringify(user)) : null;
  }

  async saveUser(user: UserRecord): Promise<UserRecord> {
    const data = await this.ensureInitialized();
    if (!data.users) data.users = {};
    data.users[user.uid] = { ...user };
    await this.persist();
    return JSON.parse(JSON.stringify(user));
  }

  async resetAllDemoData(): Promise<void> {
    const fresh = this.createInitialSeedData();
    this.inMemoryCache = fresh;
    await this.persist();
  }
}
