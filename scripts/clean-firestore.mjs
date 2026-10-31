import fs from 'node:fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Read .env.local manually
const envLocal = fs.readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envLocal.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const idx = trimmed.indexOf('=');
  if (idx !== -1) {
    const k = trimmed.slice(0, idx).trim();
    let v = trimmed.slice(idx + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    env[k] = v;
  }
}

const saBase64 = env.FIREBASE_SERVICE_ACCOUNT_BASE64;
if (!saBase64) {
  console.log('No FIREBASE_SERVICE_ACCOUNT_BASE64 in .env.local');
  process.exit(0);
}

const decoded = Buffer.from(saBase64, 'base64').toString('utf8');
const sa = JSON.parse(decoded);

const app = initializeApp({
  credential: cert(sa),
  projectId: sa.project_id || env.FIREBASE_PROJECT_ID,
});

const db = getFirestore(app);

const allowFirestore = process.argv.includes('--allow-firestore');
const isDelete = process.argv.includes('--delete');

async function main() {
  console.log('=== Firestore Inspection / Cleanup ===');
  console.log('Project ID:', sa.project_id);
  console.log('Allow Firestore flag:', allowFirestore);
  console.log('Delete flag:', isDelete);

  if (!allowFirestore) {
    console.log('BLOCKED: Script must be called with --allow-firestore to touch Firestore.');
    process.exit(1);
  }

  // 1. Inspect homes
  const homesSnap = await db.collection('homes').get();
  console.log(`\nFound ${homesSnap.size} Home(s):`);
  const demoHomes = ['demo-home-1', 'demo-home-2', 'demo-home-3'];
  const testHomesToDelete = [];

  for (const doc of homesSnap.docs) {
    const data = doc.data();
    const isDemo = demoHomes.includes(doc.id);
    const isTest = isDemo || doc.id.startsWith('test-') || data.profile?.coupleNames === 'Test' || data.name?.toLowerCase().includes('test');
    console.log(`- Home ID: ${doc.id} | Name: ${data.name || data.profile?.coupleNames || 'N/A'} | Event: ${data.profile?.eventType || 'N/A'} | isDemo/isTest: ${isTest}`);
    if (isTest || isDemo) {
      testHomesToDelete.push(doc.id);
    }
  }

  // 2. Inspect users
  const usersSnap = await db.collection('users').get();
  console.log(`\nFound ${usersSnap.size} User(s):`);
  for (const doc of usersSnap.docs) {
    const data = doc.data();
    console.log(`- User ID: ${doc.id} | Email: ${data.email || 'N/A'} | Name: ${data.name || 'N/A'} | HomeId: ${data.homeId || 'N/A'}`);
  }

  // 3. Inspect global invites
  const invitesSnap = await db.collection('invites').get();
  console.log(`\nFound ${invitesSnap.size} Global Invite(s):`);
  for (const doc of invitesSnap.docs) {
    const data = doc.data();
    console.log(`- Invite Token: ${doc.id} | HomeId: ${data.homeId} | Role: ${data.role}`);
  }

  if (isDelete) {
    console.log('\n--- DELETING TEST/DEMO HOMES AND SUBCOLLECTIONS ---');
    for (const homeId of testHomesToDelete) {
      console.log(`Deleting Home ${homeId}...`);
      const homeRef = db.collection('homes').doc(homeId);
      
      // Delete subcollections
      const subcollections = ['members', 'rooms', 'ideas', 'messages', 'decisions', 'invites', 'pendingConfirmations', 'plans', 'private'];
      for (const sub of subcollections) {
        const subSnap = await homeRef.collection(sub).get();
        for (const sDoc of subSnap.docs) {
          if (sub === 'rooms') {
            for (const nested of ['ideas', 'messages']) {
              const nestedSnap = await sDoc.ref.collection(nested).get();
              for (const nDoc of nestedSnap.docs) {
                await nDoc.ref.delete();
              }
            }
          }
          await sDoc.ref.delete();
        }
      }
      await homeRef.delete();
      console.log(`Deleted Home ${homeId} and subcollections.`);
    }

    // Delete matching invites
    for (const doc of invitesSnap.docs) {
      if (testHomesToDelete.includes(doc.data().homeId)) {
        await doc.ref.delete();
        console.log(`Deleted Global Invite ${doc.id}`);
      }
    }
    console.log('Cleanup finished.');
  } else {
    console.log('\nDRY RUN ONLY. Pass --delete along with --allow-firestore to delete.');
  }
}

main().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
