import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminApp: App | null = null;

export function getFirebaseAdminApp(): App {
  if (adminApp) return adminApp;
  if (getApps().length > 0 && getApps()[0]) {
    adminApp = getApps()[0]!;
    return adminApp;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

  if (serviceAccountBase64) {
    try {
      const decoded = Buffer.from(serviceAccountBase64, 'base64').toString('utf-8');
      const sa = JSON.parse(decoded);
      adminApp = initializeApp({
        credential: cert(sa),
        projectId: sa.project_id || projectId,
      });
      return adminApp;
    } catch (e) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_BASE64:', e);
    }
  }

  if (projectId && clientEmail && privateKey) {
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }
    adminApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      projectId,
    });
    return adminApp;
  }

  // Fallback for environments without explicit keys
  adminApp = initializeApp({ projectId: projectId || 'made-in-heaven' });
  return adminApp;
}

export function getAdminAuth(): Auth {
  return getAuth(getFirebaseAdminApp());
}

export function getAdminDb(): Firestore {
  const db = getFirestore(getFirebaseAdminApp());
  try {
    db.settings({ ignoreUndefinedProperties: true });
  } catch {
    // Already initialized settings
  }
  return db;
}
