import { getApps, initializeApp, cert, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

const app = getApps().length === 0
  ? (projectId && clientEmail && privateKey
      ? initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, '\n'),
          }),
          storageBucket: `${projectId}.appspot.com`,
        })
      : initializeApp())
  : getApp();

export const db = getFirestore(app);
export const storage = getStorage(app);

/**
 * Lazily retrieves the Cloud Storage bucket at runtime
 * to prevent compiler crashes during build-time page rendering.
 */
export function getBucket() {
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET || (projectId ? `${projectId}.appspot.com` : undefined);
  return getStorage(app).bucket(bucketName);
}
