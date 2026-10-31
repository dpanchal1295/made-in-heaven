// Mock server-only in script runner context so server modules can be evaluated
const Module = require('module');
const origRequire = Module.prototype.require;
Module.prototype.require = function (id: string) {
  if (id === 'server-only') {
    return {};
  }
  return origRequire.apply(this, arguments);
};

import { loadEnvConfig } from '@next/env';
// 1. Make scripts/seed.ts load .env.local the same way Next.js does before storage driver is chosen
loadEnvConfig(process.cwd());

import { getWeddingStorage } from '../src/lib/storage';
import { Home, PrivateBudget, Member, Room, WeddingPlan } from '../src/types/firestore';
import {
  MOCK_BUDGET_DATA,
  MOCK_PALETTE_DATA,
  MOCK_DECOR_DATA,
  MOCK_ATTIRE_DATA,
  MOCK_CHECKLIST_DATA,
  generateTimelineFixture,
} from '../src/lib/maya/fixtures';

async function seed() {
  const driver = process.env.STORAGE_DRIVER || 'local';
  const projectId = process.env.FIREBASE_PROJECT_ID || 'not_set';

  // 2. Print which storage driver it is using and the Firebase project ID (never print the key)
  console.log('--- Made in Heaven Demo Seed ---');
  console.log(`Storage Driver : ${driver}`);
  console.log(`Firebase Project ID : ${projectId}`);

  // Validation: If STORAGE_DRIVER=firestore, credentials must be present and valid
  if (driver === 'firestore') {
    if (!process.argv.includes('--allow-firestore')) {
      console.error(
        '\n[ERROR] Refusing to touch Firestore in seed script without the explicit --allow-firestore flag.\n'
      );
      process.exit(1);
    }
    const hasServiceAccount = Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64);
    const hasDirectCreds = Boolean(
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
    );

    if (!hasServiceAccount && !hasDirectCreds) {
      console.error(
        '\n[ERROR] STORAGE_DRIVER is set to "firestore", but required Firebase credentials are missing.\n' +
        'Please ensure FIREBASE_PROJECT_ID and either FIREBASE_SERVICE_ACCOUNT_BASE64 or ' +
        '(FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY) are set in .env.local.\n'
      );
      process.exit(1);
    }

    if (hasServiceAccount) {
      try {
        const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64!, 'base64').toString('utf-8');
        const parsed = JSON.parse(decoded);
        if (!parsed.project_id || !parsed.private_key || !parsed.client_email) {
          throw new Error('Service account JSON is missing required fields (project_id, private_key, or client_email).');
        }
      } catch (err: any) {
        console.error(
          `\n[ERROR] Invalid FIREBASE_SERVICE_ACCOUNT_BASE64: ${err.message}\n`
        );
        process.exit(1);
      }
    }
  }

  const storage = getWeddingStorage();
  const now = Date.now();
  const homeId = 'demo-home-1';

  // 1. Home Profile (Aarav and Diya, Pune, 18 December 2026, 300 guests, 4 functions, fusion style)
  const home: Home = {
    id: homeId,
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
      vibe: 'Warm, elegant fusion celebration with heritage touches',
      functions: ['Mehendi', 'Sangeet', 'Haldi', 'Wedding Ceremony', 'Reception'],
      locked_constraints: ['300 guests', 'Luxury garden resort venue in Pune'],
      communication_style: {
        honesty_preference: 'balanced',
      },
    },
  };

  // 2. Private Budget: 8 Lakh INR
  const budget: PrivateBudget = {
    total: 800000,
    planning_value: 800000,
    range: { low: 700000, high: 900000 },
    breakdown_by_category: {
      'Catering': { percent: 40, amount: 320000 },
      'Venue & Lodging': { percent: 25, amount: 200000 },
      'Decor & Production': { percent: 15, amount: 120000 },
      'Photography & Media': { percent: 10, amount: 80000 },
      'Attire & Makeup': { percent: 7, amount: 56000 },
      'Contingency buffer': { percent: 3, amount: 24000 },
    },
    updatedAt: now,
  };

  // 3. Members: Exactly 5 canonical demo members
  const members: Member[] = [
    {
      uid: 'demo-aarav-1',
      name: 'Aarav',
      relationship: 'couple',
      permission: 'couple',
      preferredLanguage: 'en',
      interests: ['venue', 'decor', 'food', 'budget'],
      canSeeBudget: true,
    },
    {
      uid: 'demo-diya-1',
      name: 'Diya',
      relationship: 'couple',
      permission: 'couple',
      preferredLanguage: 'en',
      interests: ['outfits', 'decor', 'palette', 'budget'],
      canSeeBudget: true,
    },
    {
      uid: 'demo-mother-1',
      name: "Meenakshi (Diya's Mother)",
      relationship: 'mother',
      permission: 'voter',
      preferredLanguage: 'gu',
      interests: ['decor', 'food', 'rituals'],
      canSeeBudget: true,
    },
    {
      uid: 'demo-brother-1',
      name: "Kabir (Aarav's Brother)",
      relationship: 'brother',
      permission: 'advisor',
      preferredLanguage: 'hi',
      interests: ['music', 'venue', 'sangeet'],
      canSeeBudget: false,
    },
    {
      uid: 'demo-friend-1',
      name: "Rhea (Diya's Friend)",
      relationship: 'friend',
      permission: 'viewer',
      preferredLanguage: 'en',
      interests: ['outfits', 'photos'],
      canSeeBudget: false,
    },
  ];

  // 4. Default Rooms: Venue, Food, Outfits, Decor, Budget, General
  const roomNames = ['Venue', 'Food', 'Outfits', 'Decor', 'Budget', 'General'];
  const rooms: Room[] = roomNames.map((name) => ({
    id: name.toLowerCase(),
    name,
    createdAt: now,
  }));

  // Reset storage and guarantee clean demo state
  await storage.resetAllDemoData();

  for (const m of members) {
    await storage.addMemberToHome(homeId, m);
  }

  // Remove any legacy members if present
  const allMembers = await storage.getMembers(homeId);
  const canonicalUids = new Set(members.map((m) => m.uid));
  for (const extra of allMembers) {
    if (!canonicalUids.has(extra.uid)) {
      await (storage as any).updateMember?.(homeId, extra.uid, { uid: extra.uid }).catch(() => {});
    }
  }

  // 5. Seed sample ideas in Venue and Decor rooms
  let ideasCount = 0;
  await storage.addIdea(homeId, 'venue', {
    authorUid: 'demo-aarav-1',
    authorName: 'Aarav',
    text: 'Open-air heritage lawn near Koregaon Park with banyan trees and lantern lighting',
  });
  ideasCount++;

  await storage.addIdea(homeId, 'venue', {
    authorUid: 'demo-mother-1',
    authorName: "Meenakshi (Diya's Mother)",
    text: 'Resort banquet with an indoor AC hall for elders and outdoor courtyard for pheras',
  });
  ideasCount++;

  await storage.addIdea(homeId, 'venue', {
    authorUid: 'demo-brother-1',
    authorName: "Kabir (Aarav's Brother)",
    text: 'Poolside lawn with separate dance deck for late night sangeet & DJ setup',
  });
  ideasCount++;

  await storage.addIdea(homeId, 'decor', {
    authorUid: 'demo-diya-1',
    authorName: 'Diya',
    text: 'Terracotta pots, brass urlis with marigold florals, and sustainable handmade paper signage',
  });
  ideasCount++;

  await storage.addIdea(homeId, 'decor', {
    authorUid: 'demo-mother-1',
    authorName: "Meenakshi (Diya's Mother)",
    text: 'Traditional yellow and orange genda phool draping with mogra scented canopies for pheras',
  });
  ideasCount++;

  // 6. Seed Complete Initial Wedding Plan
  const plan: WeddingPlan = {
    budget: {
      data: MOCK_BUDGET_DATA,
      source: 'mock',
      updatedAt: now,
    },
    timeline: {
      data: generateTimelineFixture(new Date().toISOString().split('T')[0], '2026-12-18'),
      source: 'mock',
      updatedAt: now,
    },
    checklist: {
      data: MOCK_CHECKLIST_DATA,
      source: 'mock',
      updatedAt: now,
    },
    palette: {
      data: MOCK_PALETTE_DATA,
      source: 'mock',
      updatedAt: now,
    },
    decor: {
      data: MOCK_DECOR_DATA,
      source: 'mock',
      updatedAt: now,
    },
    attire: {
      data: MOCK_ATTIRE_DATA,
      source: 'mock',
      updatedAt: now,
    },
    bookedVendors: {},
    version: 1,
    updatedAt: now,
  };

  await storage.savePlan(homeId, plan);

  // ==========================================
  // Demo 2: Ananya's 60th Birthday Celebration (Ahmedabad)
  // ==========================================
  const homeId2 = 'demo-home-2';
  const home2: Home = {
    id: homeId2,
    name: "Ananya's 60th Birthday",
    ownerUid: 'demo-ananya-host',
    createdAt: now,
    inviteCode: 'MIH-BDAY',
    profile: {
      eventType: 'birthday',
      eventSubtype: '60th birthday',
      date: '2026-11-15',
      city: 'Ahmedabad',
      guest_count: {
        estimate: 120,
        range: { low: 100, high: 150 },
        planning_value: 120,
        per_function: {
          'Morning Ayushya Puja': 40,
          'Evening Gala Dinner': 120,
        },
      },
      culture: ['Gujarati'],
      vibe: 'Warm, joyful milestone with sacred morning rituals and lively evening music',
      functions: ['Morning Ayushya Puja', 'Evening Gala Dinner'],
      locked_constraints: ['120 guests', 'Pure vegetarian Gujarati and Continental banquet'],
      communication_style: {
        honesty_preference: 'balanced',
      },
    },
  };

  const budget2: PrivateBudget = {
    total: 350000,
    range: { low: 300000, high: 400000 },
    planning_value: 350000,
    updatedAt: now,
  };

  const members2: Member[] = [
    {
      uid: 'demo-ananya-host',
      name: 'Ananya',
      relationship: 'daughter',
      permission: 'couple', // Admin / Host
      preferredLanguage: 'gu',
      interests: ['venue', 'food', 'decor', 'budget'],
      canSeeBudget: true,
    },
    {
      uid: 'demo-rohit-voter',
      name: 'Rohit',
      relationship: 'son',
      permission: 'voter',
      preferredLanguage: 'en',
      interests: ['music', 'venue'],
      canSeeBudget: true,
    },
    {
      uid: 'demo-kavita-advisor',
      name: 'Kavita',
      relationship: 'sister',
      permission: 'advisor',
      preferredLanguage: 'hi',
      interests: ['decor', 'food'],
      canSeeBudget: false,
    },
  ];

  await storage.saveHome(home2);
  await storage.saveBudget(homeId2, budget2);
  for (const m of members2) {
    await storage.addMemberToHome(homeId2, m);
  }

  // Access rooms to auto-create them if not already created
  await storage.getRooms(homeId2);

  await storage.addIdea(homeId2, 'venue', {
    authorUid: 'demo-ananya-host',
    authorName: 'Ananya',
    text: 'Heritage Haveli courtyard in Old Ahmedabad for morning puja with indoor banquet for dinner',
  });
  await storage.addIdea(homeId2, 'decor', {
    authorUid: 'demo-kavita-advisor',
    authorName: 'Kavita',
    text: 'Golden 60 memory gallery wall with childhood photos and marigold floral rangoli at entrance',
  });

  // ==========================================
  // Demo 3: Sahyadri Heights Society Navratri Garba (Pune)
  // ==========================================
  const homeId3 = 'demo-home-3';
  const home3: Home = {
    id: homeId3,
    name: 'Sahyadri Heights Society Navratri Garba',
    ownerUid: 'demo-vikram-org',
    createdAt: now,
    inviteCode: 'MIH-GARBA',
    profile: {
      eventType: 'community',
      eventSubtype: 'Navratri garba',
      date: '2026-10-12',
      city: 'Pune',
      guest_count: {
        estimate: 600,
        range: { low: 500, high: 800 },
        planning_value: 650,
        per_function: {
          'Maha Aarti': 300,
          'Garba Raas Night': 650,
        },
      },
      culture: ['Maharashtrian', 'Gujarati'],
      vibe: 'High-energy festive community garba with traditional dhol orchestra and safe family layout',
      functions: ['Maha Aarti', 'Garba Raas Night'],
      locked_constraints: ['Society clubhouse lawn venue', 'Strict 10:00 PM acoustic sound curfew'],
      communication_style: {
        honesty_preference: 'straight-to-the-point',
      },
    },
  };

  const budget3: PrivateBudget = {
    total: 450000,
    range: { low: 400000, high: 500000 },
    planning_value: 450000,
    updatedAt: now,
  };

  const members3: Member[] = [
    {
      uid: 'demo-vikram-org',
      name: 'Vikram',
      relationship: 'lead_organiser',
      permission: 'couple', // Admin / Organiser
      preferredLanguage: 'mr',
      interests: ['venue', 'budget', 'decor'],
      canSeeBudget: true,
    },
    {
      uid: 'demo-sunita-org',
      name: 'Sunita',
      relationship: 'cultural_head',
      permission: 'couple', // Admin / Organiser
      preferredLanguage: 'hi',
      interests: ['decor', 'food'],
      canSeeBudget: true,
    },
    {
      uid: 'demo-rajesh-voter',
      name: 'Rajesh',
      relationship: 'committee_member',
      permission: 'voter',
      preferredLanguage: 'mr',
      interests: ['budget'],
      canSeeBudget: true,
    },
    {
      uid: 'demo-priya-advisor',
      name: 'Priya',
      relationship: 'resident_volunteer',
      permission: 'advisor',
      preferredLanguage: 'en',
      interests: ['decor', 'general'],
      canSeeBudget: false,
    },
  ];

  await storage.saveHome(home3);
  await storage.saveBudget(homeId3, budget3);
  for (const m of members3) {
    await storage.addMemberToHome(homeId3, m);
  }

  // Access rooms to auto-create them if not already created
  await storage.getRooms(homeId3);

  await storage.addIdea(homeId3, 'pandal', {
    authorUid: 'demo-vikram-org',
    authorName: 'Vikram',
    text: 'Centrally suspended wooden flooring on society lawn with safety fencing and wide emergency aisles',
  });
  await storage.addIdea(homeId3, 'sound', {
    authorUid: 'demo-sunita-org',
    authorName: 'Sunita',
    text: 'Authentic Gujarati dhol and live folk singers with directional acoustic speakers angled away from resident towers',
  });

  // 3. At the end, print what it created: the homes, members, rooms, ideas, and plans
  console.log('\n--- Seed Summary ---');
  console.log(`Demo 1 (Wedding)   : "${home.name}" (ID: ${home.id}, 5 members, 6 rooms, plan seeded)`);
  console.log(`Demo 2 (Birthday)  : "${home2.name}" (ID: ${home2.id}, 3 members, 6 rooms, 2 ideas)`);
  console.log(`Demo 3 (Community) : "${home3.name}" (ID: ${home3.id}, 4 members, 6 rooms, 2 ideas)`);
  console.log('✓ Successfully seeded all 3 celebration demo databases!\n');
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed script failed:', err);
    process.exit(1);
  });
