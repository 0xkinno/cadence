import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';

export async function GET() {
  try {
    const testRef = db.collection('health-check').doc('test');

    // 1. Write a test document
    await testRef.set({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });

    // 2. Read it back
    const doc = await testRef.get();
    const data = doc.data();

    // 3. Clean up (delete document)
    await testRef.delete();

    if (data && data.status === 'ok') {
      return NextResponse.json({
        status: 'healthy',
        database: 'connected',
        timestamp: data.timestamp,
      });
    }

    return NextResponse.json(
      { status: 'unhealthy', error: 'Firestore roundtrip failed: Data mismatch' },
      { status: 500 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error.message || String(error),
        tip: 'Ensure your FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables are set correctly, or that you are logged into gcloud locally.'
      },
      { status: 500 }
    );
  }
}
