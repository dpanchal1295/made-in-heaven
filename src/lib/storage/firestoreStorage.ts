import 'server-only';
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
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
} from '@/types/firestore';
import { ProfileUpdate } from '@/lib/maya/schemas';
import { parseRangeAndPlanningValue } from '@/lib/utils/format';
import {
  IWeddingStorage,
  PendingConfirmation,
  ApplyUpdatesResult,
  ApplyConfirmationResult,
} from './types';

import { sanitizeForFirestore, restoreFromFirestore } from './sanitizer';

const DEFAULT_ROOM_NAMES = ['Venue', 'Food', 'Outfits', 'Decor', 'Budget', 'General'];

function getAdminApp(): App {
  if (getApps().length > 0 && getApps()[0]) {
    return getApps()[0]!;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

  if (serviceAccountBase64) {
    try {
      const decoded = Buffer.from(serviceAccountBase64, 'base64').toString('utf-8');
      const sa = JSON.parse(decoded);
      return initializeApp({
        credential: cert(sa),
        projectId: sa.project_id || projectId,
      });
    } catch (e) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_BASE64:', e);
    }
  }

  if (projectId && clientEmail && privateKey) {
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      projectId,
    });
  }

  // Fallback to application default credentials or local dev project
  return initializeApp({
    projectId: projectId || 'demo-made-in-heaven',
  });
}

export class FirestoreWeddingStorage implements IWeddingStorage {
  private db: Firestore;

  constructor() {
    const app = getAdminApp();
    this.db = getFirestore(app);
    try {
      this.db.settings({ ignoreUndefinedProperties: true });
    } catch {
      // Ignore if settings already applied
    }
  }

  async getHome(homeId: string): Promise<Home> {
    const snap = await this.db.collection('homes').doc(homeId).get();
    if (!snap.exists) {
      const newHome: Home = {
        id: homeId,
        name: 'Our Celebration',
        ownerUid: 'unknown',
        createdAt: Date.now(),
        profile: { eventType: 'wedding' },
      };
      await this.db.collection('homes').doc(homeId).set(newHome);
      return newHome;
    }
    const data = snap.data() as Home;
    return { ...data, id: snap.id };
  }

  async saveHome(home: Home): Promise<Home> {
    await this.db.collection('homes').doc(home.id).set(home);
    return home;
  }

  async getBudget(homeId: string): Promise<PrivateBudget | null> {
    const snap = await this.db
      .collection('homes')
      .doc(homeId)
      .collection('private')
      .doc('budget')
      .get();

    if (!snap.exists) return null;
    return snap.data() as PrivateBudget;
  }

  async saveBudget(homeId: string, budget: PrivateBudget): Promise<PrivateBudget> {
    await this.db
      .collection('homes')
      .doc(homeId)
      .collection('private')
      .doc('budget')
      .set(budget);
    return budget;
  }

  async getSpeaker(homeId: string, uid?: string): Promise<Member> {
    if (!uid) {
      return {
        uid: 'anonymous',
        name: 'Guest Member',
        relationship: 'family',
        permission: 'viewer',
        preferredLanguage: 'en',
        interests: [],
        canSeeBudget: false,
      };
    }

    const snap = await this.db
      .collection('homes')
      .doc(homeId)
      .collection('members')
      .doc(uid)
      .get();

    if (snap.exists) {
      return snap.data() as Member;
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

  async getMembers(homeId: string): Promise<Member[]> {
    const snaps = await this.db
      .collection('homes')
      .doc(homeId)
      .collection('members')
      .get();

    return snaps.docs.map((d) => d.data() as Member);
  }

  async getRecentMessages(homeId: string, roomId: string, limit: number = 20): Promise<Message[]> {
    const snaps = await this.db
      .collection('homes')
      .doc(homeId)
      .collection('rooms')
      .doc(roomId)
      .collection('messages')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    return snaps.docs.map((d) => d.data() as Message).reverse();
  }

  async addMessage(
    homeId: string,
    roomId: string,
    message: Omit<Message, 'id' | 'createdAt'>
  ): Promise<Message> {
    const id = `msg_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const newMessage: Message = {
      ...message,
      id,
      createdAt: Date.now(),
    };

    await this.db
      .collection('homes')
      .doc(homeId)
      .collection('rooms')
      .doc(roomId)
      .collection('messages')
      .doc(id)
      .set(newMessage);

    return newMessage;
  }

  async applyProfileUpdates(
    homeId: string,
    updates: ProfileUpdate[],
    speakerPermission: MemberPermission
  ): Promise<ApplyUpdatesResult> {
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

    await this.db.collection('homes').doc(homeId).update({ profile: home.profile });
    if (budget) {
      await this.db
        .collection('homes')
        .doc(homeId)
        .collection('private')
        .doc('budget')
        .set(budget, { merge: true });
    }

    return {
      profile: home.profile,
      budget,
      applied,
      rejected,
    };
  }

  async savePendingConfirmation(
    homeId: string,
    confirmation: Omit<PendingConfirmation, 'id' | 'createdAt'>
  ): Promise<PendingConfirmation> {
    const id = `conf_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const newConf: PendingConfirmation = {
      ...confirmation,
      id,
      createdAt: Date.now(),
    };

    await this.db
      .collection('homes')
      .doc(homeId)
      .collection('pendingConfirmations')
      .doc(id)
      .set(newConf);

    return newConf;
  }

  async getPendingConfirmation(homeId: string, confirmationId: string): Promise<PendingConfirmation | null> {
    const snap = await this.db
      .collection('homes')
      .doc(homeId)
      .collection('pendingConfirmations')
      .doc(confirmationId)
      .get();

    return snap.exists ? (snap.data() as PendingConfirmation) : null;
  }

  async getPendingConfirmations(homeId: string): Promise<PendingConfirmation[]> {
    const snaps = await this.db
      .collection('homes')
      .doc(homeId)
      .collection('pendingConfirmations')
      .get();

    return snaps.docs.map((d) => d.data() as PendingConfirmation);
  }

  async applyConfirmation(
    homeId: string,
    confirmationId: string,
    speakerPermission: MemberPermission
  ): Promise<ApplyConfirmationResult> {
    const conf = await this.getPendingConfirmation(homeId, confirmationId);
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

    await this.rejectConfirmation(homeId, confirmationId);

    return {
      success: true,
      profile: result.profile,
      budget: result.budget,
      appliedUpdate: update,
    };
  }

  async rejectConfirmation(homeId: string, confirmationId: string): Promise<boolean> {
    await this.db
      .collection('homes')
      .doc(homeId)
      .collection('pendingConfirmations')
      .doc(confirmationId)
      .delete();
    return true;
  }

  async resetDemoData(homeId: string): Promise<{ profile: EventProfile; budget: PrivateBudget }> {
    const now = Date.now();
    const profile: EventProfile = {
      eventType: 'wedding',
      date: '2026-12-18',
      city: 'Pune',
      guest_count: {
        estimate: 300,
        range: { low: 250, high: 350 },
        planning_value: 300,
      },
      culture: ['Maharashtrian', 'Gujarati'],
      vibe: 'Warm, elegant fusion celebration',
      functions: ['Mehendi', 'Sangeet', 'Haldi', 'Wedding Ceremony', 'Reception'],
      locked_constraints: ['300 guests', 'Luxury garden resort venue in Pune'],
      communication_style: { honesty_preference: 'balanced' },
    };

    const budget: PrivateBudget = {
      total: 800000,
      planning_value: 800000,
      range: { low: 700000, high: 900000 },
      updatedAt: now,
    };

    await this.db.collection('homes').doc(homeId).set({
      id: homeId,
      name: 'Aarav and Diya',
      ownerUid: 'demo-aarav-1',
      createdAt: now,
      inviteCode: 'MIH-2026',
      profile,
    });

    await this.db
      .collection('homes')
      .doc(homeId)
      .collection('private')
      .doc('budget')
      .set(budget);

    await this.clearPlan(homeId);

    return { profile, budget };
  }

  async getPlan(homeId: string): Promise<WeddingPlan | null> {
    const snap = await this.db.collection('homes').doc(homeId).collection('plan').doc('current').get();
    if (!snap.exists) return null;
    return restoreFromFirestore(snap.data() as WeddingPlan);
  }

  async savePlan(homeId: string, plan: WeddingPlan): Promise<WeddingPlan> {
    const updated: WeddingPlan = {
      ...plan,
      updatedAt: Date.now(),
      version: (plan.version || 0) + 1,
    };
    await this.db.collection('homes').doc(homeId).collection('plan').doc('current').set(sanitizeForFirestore(updated));
    return updated;
  }

  async savePlanPart(
    homeId: string,
    part: 'budget' | 'timeline' | 'checklist' | 'palette' | 'decor' | 'attire',
    partData: unknown,
    source: 'mock' | 'live' = 'mock'
  ): Promise<WeddingPlan> {
    const existing = (await this.getPlan(homeId)) || {
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

    await this.db.collection('homes').doc(homeId).collection('plan').doc('current').set(sanitizeForFirestore(updatedPlan));
    return updatedPlan;
  }

  async toggleChecklistItem(homeId: string, vendorType: string, booked: boolean): Promise<WeddingPlan> {
    const plan = (await this.getPlan(homeId)) || {
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

    await this.db.collection('homes').doc(homeId).collection('plan').doc('current').set(plan);
    return plan;
  }

  async clearPlan(homeId: string): Promise<WeddingPlan> {
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
    await this.db.collection('homes').doc(homeId).collection('plan').doc('current').set(cleared);
    return cleared;
  }

  async getHomeByInviteCode(inviteCode: string): Promise<Home | null> {
    const snaps = await this.db
      .collection('homes')
      .where('inviteCode', '==', inviteCode.trim().toUpperCase())
      .limit(1)
      .get();

    if (snaps.empty) return null;
    return snaps.docs[0].data() as Home;
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

    const batch = this.db.batch();
    batch.set(this.db.collection('homes').doc(homeId), newHome);
    batch.set(this.db.collection('homes').doc(homeId).collection('members').doc(details.ownerUid), ownerMember);
    batch.set(this.db.collection('homes').doc(homeId).collection('private').doc('budget'), {
      total: 0,
      updatedAt: now,
    });

    for (const roomName of DEFAULT_ROOM_NAMES) {
      const roomDoc = this.db.collection('homes').doc(homeId).collection('rooms').doc(roomName.toLowerCase());
      batch.set(roomDoc, {
        id: roomName.toLowerCase(),
        name: roomName,
        createdAt: now,
      });
    }

    await batch.commit();

    return {
      home: newHome,
      member: ownerMember,
    };
  }

  async addMemberToHome(homeId: string, member: Member): Promise<Member> {
    await this.db
      .collection('homes')
      .doc(homeId)
      .collection('members')
      .doc(member.uid)
      .set(member, { merge: true });
    return member;
  }

  async updateMember(homeId: string, uid: string, updates: Partial<Member>): Promise<Member> {
    const ref = this.db.collection('homes').doc(homeId).collection('members').doc(uid);
    const snap = await ref.get();
    if (!snap.exists) {
      throw new Error(`Member ${uid} not found in home ${homeId}`);
    }

    const current = snap.data() as Member;
    const updated = {
      ...current,
      ...updates,
      uid,
    };

    await ref.set(updated, { merge: true });
    return updated;
  }

  async updateCommunicationStyle(
    homeId: string,
    honestyPreference: 'gentle' | 'balanced' | 'straight-to-the-point'
  ): Promise<EventProfile> {
    const home = await this.getHome(homeId);
    if (!home.profile) home.profile = {};
    home.profile.communication_style = { honesty_preference: honestyPreference };

    await this.db.collection('homes').doc(homeId).update({
      'profile.communication_style.honesty_preference': honestyPreference,
    });
    return home.profile;
  }

  async getRooms(homeId: string): Promise<Room[]> {
    const snaps = await this.db.collection('homes').doc(homeId).collection('rooms').get();
    if (snaps.empty) {
      const batch = this.db.batch();
      const rooms: Room[] = DEFAULT_ROOM_NAMES.map((name) => ({
        id: name.toLowerCase(),
        name,
        createdAt: Date.now(),
      }));
      for (const r of rooms) {
        batch.set(this.db.collection('homes').doc(homeId).collection('rooms').doc(r.id), r);
      }
      await batch.commit();
      return rooms;
    }
    return snaps.docs.map((d) => d.data() as Room);
  }

  async getIdeas(homeId: string, roomId: string, since?: number): Promise<Idea[]> {
    let query = this.db
      .collection('homes')
      .doc(homeId)
      .collection('rooms')
      .doc(roomId)
      .collection('ideas')
      .orderBy('createdAt', 'asc');

    if (since !== undefined) {
      query = query.where('createdAt', '>', since);
    }

    const snaps = await query.get();
    return snaps.docs.map((d) => d.data() as Idea);
  }

  async addIdea(
    homeId: string,
    roomId: string,
    idea: Omit<Idea, 'id' | 'createdAt'>
  ): Promise<Idea> {
    const id = `idea_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const newIdea: Idea = {
      ...idea,
      id,
      createdAt: Date.now(),
    };

    await this.db
      .collection('homes')
      .doc(homeId)
      .collection('rooms')
      .doc(roomId)
      .collection('ideas')
      .doc(id)
      .set(newIdea);

    return newIdea;
  }

  async getDecisions(homeId: string): Promise<Decision[]> {
    const snaps = await this.db.collection('homes').doc(homeId).collection('decisions').get();
    return snaps.docs.map((d) => restoreFromFirestore(d.data() as Decision));
  }

  async getDecision(homeId: string, decisionId: string): Promise<Decision | null> {
    const snap = await this.db
      .collection('homes')
      .doc(homeId)
      .collection('decisions')
      .doc(decisionId)
      .get();
    return snap.exists ? restoreFromFirestore(snap.data() as Decision) : null;
  }

  async saveDecision(homeId: string, decision: Decision): Promise<Decision> {
    await this.db
      .collection('homes')
      .doc(homeId)
      .collection('decisions')
      .doc(decision.id)
      .set(sanitizeForFirestore(decision));
    return decision;
  }

  async createInvite(invite: HomeInvite): Promise<HomeInvite> {
    await this.db.collection('invites').doc(invite.token).set(invite);
    return invite;
  }

  async getInvite(token: string): Promise<HomeInvite | null> {
    const snap = await this.db.collection('invites').doc(token).get();
    return snap.exists ? (snap.data() as HomeInvite) : null;
  }

  async deleteInvite(token: string): Promise<void> {
    await this.db.collection('invites').doc(token).delete();
  }

  async resetAllDemoData(): Promise<void> {
    await this.resetDemoData('demo-home-1');
  }
}

