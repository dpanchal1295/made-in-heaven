import { describe, it } from 'node:test';
import assert from 'node:assert';
import { IWeddingStorage } from '@/lib/storage/types';
import { Home, Member, Room, WeddingPlan } from '@/types/firestore';
import { sanitizeForFirestore, restoreFromFirestore } from './sanitizer';

class InMemoryWeddingStorage implements IWeddingStorage {
  private homes = new Map<string, Home>();
  private members = new Map<string, Map<string, Member>>();
  private rooms = new Map<string, Map<string, Room>>();
  private plans = new Map<string, WeddingPlan>();
  private budgets = new Map<string, any>();
  private ideas = new Map<string, Map<string, any[]>>();
  private messages = new Map<string, Map<string, any[]>>();
  private decisions = new Map<string, Map<string, any>>();
  private pendingConfirmations = new Map<string, any>();
  private invites = new Map<string, any>();

  async getHome(homeId: string): Promise<Home> {
    const h = this.homes.get(homeId);
    if (!h) throw new Error('Home not found');
    return h;
  }
  async saveHome(home: Home): Promise<Home> {
    this.homes.set(home.id, home);
    return home;
  }
  async getBudget(homeId: string) { return this.budgets.get(homeId) || null; }
  async saveBudget(homeId: string, budget: any) {
    this.budgets.set(homeId, budget);
    return budget;
  }
  async getSpeaker(homeId: string, uid?: string): Promise<Member> {
    if (!uid) return { uid: 'anon', name: 'Anon', permission: 'viewer', relationship: 'guest', preferredLanguage: 'en', interests: [], canSeeBudget: false };
    return this.members.get(homeId)?.get(uid) || { uid, name: 'Anon', permission: 'viewer', relationship: 'guest', preferredLanguage: 'en', interests: [], canSeeBudget: false };
  }
  async getMembers(homeId: string) { return Array.from(this.members.get(homeId)?.values() || []); }
  async addMemberToHome(homeId: string, member: Member) {
    if (!this.members.has(homeId)) this.members.set(homeId, new Map());
    this.members.get(homeId)!.set(member.uid, member);
    return member;
  }
  async updateMember(homeId: string, uid: string, updates: Partial<Member>): Promise<Member> {
    const mem = await this.getSpeaker(homeId, uid);
    const updated: Member = { ...mem, ...updates };
    this.members.get(homeId)!.set(uid, updated);
    return updated;
  }
  async getRooms(homeId: string) { return Array.from(this.rooms.get(homeId)?.values() || []); }
  async getRecentMessages(homeId: string, roomId: string) { return this.messages.get(homeId)?.get(roomId) || []; }
  async addMessage(homeId: string, roomId: string, msg: any) {
    if (!this.messages.has(homeId)) this.messages.set(homeId, new Map());
    if (!this.messages.get(homeId)!.has(roomId)) this.messages.get(homeId)!.set(roomId, []);
    const m = { ...msg, id: 'm1', createdAt: Date.now() };
    this.messages.get(homeId)!.get(roomId)!.push(m);
    return m;
  }
  async getIdeas(homeId: string, roomId: string) { return this.ideas.get(homeId)?.get(roomId) || []; }
  async addIdea(homeId: string, roomId: string, idea: any) {
    if (!this.ideas.has(homeId)) this.ideas.set(homeId, new Map());
    if (!this.ideas.get(homeId)!.has(roomId)) this.ideas.get(homeId)!.set(roomId, []);
    const i = { ...idea, id: 'i1', createdAt: Date.now() };
    this.ideas.get(homeId)!.get(roomId)!.push(i);
    return i;
  }
  async getPlan(homeId: string) { return this.plans.get(homeId) || null; }
  async savePlan(homeId: string, plan: WeddingPlan) {
    const sanitized = sanitizeForFirestore(plan);
    this.plans.set(homeId, sanitized);
    return sanitized;
  }
  async savePlanPart(homeId: string, part: any, data: any, source: any = 'mock') {
    const existing = await this.getPlan(homeId) || { version: 0 } as any;
    const updated: WeddingPlan = {
      ...existing,
      [part]: { data, source, updatedAt: Date.now() },
      version: (existing.version || 0) + 1,
      updatedAt: Date.now(),
    };
    const sanitized = sanitizeForFirestore(updated);
    this.plans.set(homeId, sanitized);
    return sanitized;
  }
  async toggleChecklistItem(homeId: string, vendorType: string, booked: boolean) {
    const p = await this.getPlan(homeId) || {} as any;
    p.bookedVendors = { ...(p.bookedVendors || {}), [vendorType]: booked };
    return p;
  }
  async clearPlan(homeId: string) {
    const empty: any = { budget: null, timeline: null, version: 1 };
    this.plans.set(homeId, empty);
    return empty;
  }
  async applyProfileUpdates(homeId: string, updates: any) { return { profile: {}, budget: null, applied: updates, rejected: [] }; }
  async savePendingConfirmation(homeId: string, conf: any) { return { ...conf, id: 'c1' }; }
  async getPendingConfirmation() { return null; }
  async getPendingConfirmations() { return []; }
  async applyConfirmation() { return { success: true }; }
  async rejectConfirmation() { return true; }
  async resetDemoData(homeId: string) { return { profile: {}, budget: {} as any }; }
  async getHomeByInviteCode() { return null; }
  async createHomeWithDetails() { return {} as any; }
  async updateCommunicationStyle(homeId: string, s: any) { return {} as any; }
  async getDecisions() { return []; }
  async getDecision() { return null; }
  async saveDecision(homeId: string, d: any) { return d; }
  async createInvite(i: any) { return i; }
  async getInvite() { return null; }
  async deleteInvite() { return; }
  async resetAllDemoData() {
    this.homes.set('demo-home-1', {
      id: 'demo-home-1',
      name: 'Aarav and Diya',
      ownerUid: 'demo-aarav-1',
      createdAt: Date.now(),
      profile: { eventType: 'wedding' },
    });
    this.rooms.set('demo-home-1', new Map([
      ['venue', { id: 'venue', name: 'Venue', createdAt: Date.now() }],
      ['food', { id: 'food', name: 'Food', createdAt: Date.now() }],
      ['outfits', { id: 'outfits', name: 'Outfits', createdAt: Date.now() }],
      ['decor', { id: 'decor', name: 'Decor', createdAt: Date.now() }],
      ['budget', { id: 'budget', name: 'Budget', createdAt: Date.now() }],
      ['general', { id: 'general', name: 'General', createdAt: Date.now() }],
    ]));
  }
}

describe('Storage and Plan Data Sanitization', () => {
  it('sanitizes undefined values and nested arrays before saving', () => {
    const rawData = {
      title: 'Sample Plan',
      notes: undefined,
      nestedMatrix: [
        ['item 1', 'item 2'],
        ['item 3', 'item 4'],
      ],
      deep: {
        field: undefined,
        active: true,
      },
    };

    const sanitized = sanitizeForFirestore(rawData);

    // Verify undefined was stripped
    assert.strictEqual(sanitized.hasOwnProperty('notes'), false);
    assert.strictEqual((sanitized.deep as any).hasOwnProperty('field'), false);
    assert.strictEqual(sanitized.deep.active, true);

    // Verify no arrays directly inside arrays (converted to object wrappers)
    assert.strictEqual(Array.isArray(sanitized.nestedMatrix), true);
    for (const entry of sanitized.nestedMatrix) {
      assert.strictEqual(Array.isArray(entry), false);
      assert.strictEqual(entry.hasOwnProperty('items'), true);
      assert.strictEqual(Array.isArray((entry as any).items), true);
    }

    // Round-trip test: verify restoreFromFirestore completely restores original array of arrays
    const restored = restoreFromFirestore(sanitized);
    assert.deepStrictEqual(restored.nestedMatrix, [
      ['item 1', 'item 2'],
      ['item 3', 'item 4'],
    ]);
  });

  it('runs seed flow and reads back home, 5 members, 6 rooms, and plan through storage', async () => {
    const storage = new InMemoryWeddingStorage();
    await storage.resetAllDemoData();

    // Seed 5 canonical members
    const members: Member[] = [
      { uid: 'demo-aarav-1', name: 'Aarav', relationship: 'couple', permission: 'couple', preferredLanguage: 'en', interests: [], canSeeBudget: true },
      { uid: 'demo-diya-1', name: 'Diya', relationship: 'couple', permission: 'couple', preferredLanguage: 'en', interests: [], canSeeBudget: true },
      { uid: 'demo-mother-1', name: 'Meenakshi', relationship: 'mother', permission: 'voter', preferredLanguage: 'gu', interests: [], canSeeBudget: true },
      { uid: 'demo-brother-1', name: 'Kabir', relationship: 'brother', permission: 'advisor', preferredLanguage: 'hi', interests: [], canSeeBudget: false },
      { uid: 'demo-friend-1', name: 'Rhea', relationship: 'friend', permission: 'viewer', preferredLanguage: 'en', interests: [], canSeeBudget: false },
    ];
    for (const m of members) {
      await storage.addMemberToHome('demo-home-1', m);
    }

    // Seed sample plan
    await storage.savePlan('demo-home-1', {
      budget: { data: [{ category: 'Catering', percent: 40 }], source: 'mock', updatedAt: Date.now() } as any,
      timeline: { data: [{ when: 'Oct', task: 'Venue' }], source: 'mock', updatedAt: Date.now() } as any,
      checklist: null,
      palette: null,
      decor: null,
      attire: null,
      bookedVendors: {},
      version: 1,
      updatedAt: Date.now(),
    });

    // Read back and verify
    const home = await storage.getHome('demo-home-1');
    assert.strictEqual(home.name, 'Aarav and Diya');

    const loadedMembers = await storage.getMembers('demo-home-1');
    assert.strictEqual(loadedMembers.length, 5);

    const loadedRooms = await storage.getRooms('demo-home-1');
    assert.strictEqual(loadedRooms.length, 6);

    const plan = await storage.getPlan('demo-home-1');
    assert.notStrictEqual(plan, null);
    assert.strictEqual(plan?.version, 1);
    assert.strictEqual((plan?.budget?.data as any[])?.length, 1);
  });
});

