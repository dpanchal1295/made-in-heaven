import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

/**
 * Client-side Firebase configuration using environment variables.
 * These public variables are safe to expose to the browser client.
 */
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

export function isFirebaseConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.authDomain
  );
}

// Initialize Firebase singleton
let app: FirebaseApp;
let auth: Auth | null = null;
let db: Firestore | null = null;
let googleProvider: GoogleAuthProvider | null = null;

if (typeof window !== 'undefined' || isFirebaseConfigured()) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });
  } catch (error) {
    console.warn('Firebase initialization warning:', error);
    if (getApps().length > 0) {
      app = getApp();
    } else {
      app = initializeApp({ projectId: 'placeholder-app', apiKey: 'placeholder' });
    }
  }
} else {
  app = getApps().length > 0 ? getApp() : initializeApp({ projectId: 'placeholder-app', apiKey: 'placeholder' });
}

export function getClientApp(): FirebaseApp {
  return app;
}

export function getClientAuth(): Auth {
  if (!auth) auth = getAuth(app);
  return auth;
}

export function getClientFirestore(): Firestore {
  if (!db) db = getFirestore(app);
  return db;
}

export function getGoogleAuthProvider(): GoogleAuthProvider {
  if (!googleProvider) {
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });
  }
  return googleProvider;
}
