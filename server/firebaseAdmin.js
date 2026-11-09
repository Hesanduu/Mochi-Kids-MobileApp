// Firebase's official server library. It is set up once, on first use, with the
// key file named in server/.env. Admin access ignores the Firestore security
// rules, so every use must already know which parent it is working for.
import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function ensureApp() {
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    throw new Error('GOOGLE_APPLICATION_CREDENTIALS is missing from server/.env');
  }
  if (getApps().length === 0) initializeApp({ credential: applicationDefault() });
}

export function adminAuth() {
  ensureApp();
  return getAuth();
}

export function adminDb() {
  ensureApp();
  return getFirestore();
}
