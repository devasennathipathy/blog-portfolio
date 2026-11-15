import './config.js';
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

export function firebaseAuth() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) return null;
  if (!getApps().length) {
    let credential;
    if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) {
      credential = process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY
        ? cert({ projectId, clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') })
        : applicationDefault();
    }
    initializeApp({ projectId, ...(credential ? { credential } : {}) });
  }
  return getAuth();
}
