import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import { getFirebaseAdminApp, getAdminDb } from '../src/lib/firebase/admin';

async function main() {
  const isApply = process.argv.includes('--apply') || process.argv.includes('--delete');
  const demoHomeIds = ['demo-home-1', 'demo-home-2', 'demo-home-3'];

  console.log('====================================================');
  console.log('   Made in Heaven - Demo Data Removal Script');
  console.log('====================================================\n');

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  console.log(`Target Firebase Project ID: ${projectId}`);
  console.log(`Mode: ${isApply ? 'DESTRUCTIVE DELETE' : 'DRY RUN (Preview Only)'}\n`);

  const db = getAdminDb();
  let totalDocsCount = 0;

  for (const homeId of demoHomeIds) {
    console.log(`--- Checking Home: ${homeId} ---`);
    const homeRef = db.collection('homes').doc(homeId);
    const homeSnap = await homeRef.get();

    if (!homeSnap.exists) {
      console.log(`  [Home Doc] ${homeId}: DOES NOT EXIST (Already Clean)`);
    } else {
      console.log(`  [Home Doc] ${homeId}: FOUND`);
      totalDocsCount += 1;
    }

    // Inspect subcollections
    const subcollections = ['members', 'rooms', 'ideas', 'messages', 'decisions', 'invites', 'pendingConfirmations', 'plans', 'private'];
    for (const sub of subcollections) {
      const subRef = homeRef.collection(sub);
      const subSnap = await subRef.get();
      if (!subSnap.empty) {
        console.log(`  [Subcollection] ${sub}: ${subSnap.size} document(s)`);
        for (const doc of subSnap.docs) {
          console.log(`     -> ID: ${doc.id}`);
          totalDocsCount += 1;

          // Nested subcollections under rooms (e.g., ideas, messages)
          if (sub === 'rooms') {
            for (const nested of ['ideas', 'messages']) {
              const nestedSnap = await doc.ref.collection(nested).get();
              if (!nestedSnap.empty) {
                console.log(`        [Nested: ${nested} in room ${doc.id}]: ${nestedSnap.size} document(s)`);
                totalDocsCount += nestedSnap.size;
                if (isApply) {
                  for (const nDoc of nestedSnap.docs) {
                    await nDoc.ref.delete();
                  }
                }
              }
            }
          }

          if (isApply) {
            await doc.ref.delete();
          }
        }
      }
    }

    if (homeSnap.exists && isApply) {
      await homeRef.delete();
      console.log(`  [DELETED] Home document ${homeId} deleted.`);
    }
    console.log('');
  }

  // Also inspect demo invites in the global /invites collection
  const invitesSnap = await db.collection('invites').get();
  for (const invDoc of invitesSnap.docs) {
    const data = invDoc.data();
    if (demoHomeIds.includes(data.homeId)) {
      console.log(`[Global Invite] ID: ${invDoc.id} associated with demo home ${data.homeId}`);
      totalDocsCount += 1;
      if (isApply) {
        await invDoc.ref.delete();
        console.log(`  [DELETED] Global invite ${invDoc.id}`);
      }
    }
  }

  console.log('----------------------------------------------------');
  if (isApply) {
    console.log(`Cleanup complete! Successfully deleted ${totalDocsCount} documents across demo homes.`);
  } else {
    console.log(`DRY RUN COMPLETE.`);
    console.log(`Total demo documents found: ${totalDocsCount}`);
    console.log(`To delete these documents permanently, run:`);
    console.log(`npx tsx scripts/remove-demo-data.ts --apply`);
  }
  console.log('====================================================\n');
}

main().catch((err) => {
  console.error('Error executing demo data removal:', err);
  process.exit(1);
});

