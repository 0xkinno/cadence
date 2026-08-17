import { cookies } from 'next/headers';
import crypto from 'crypto';

const SESSION_COOKIE_NAME = 'cadence_session';
const SESSION_SECRET = process.env.SESSION_SECRET || 'cadence-secret-key-rhythm-hackathon-2026-fallback';

export interface SessionData {
  userId: string;
  role: 'creator' | 'vendor';
  email: string;
  shopId?: string;
  shopSlug?: string;
}

function sign(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url');
}

export function createSessionToken(data: SessionData): string {
  const expiresAt = Date.now() + 14 * 24 * 60 * 60 * 1000;
  const payloadObj = {
    ...data,
    exp: expiresAt,
  };
  const payload = Buffer.from(JSON.stringify(payloadObj)).toString('base64url');
  const signature = sign(payload, SESSION_SECRET);
  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string): SessionData | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payload, signature] = parts;
  const expectedSignature = sign(payload, SESSION_SECRET);

  if (signature !== expectedSignature) {
    return null;
  }

  try {
    const rawPayload = Buffer.from(payload, 'base64url').toString('utf8');
    const data = JSON.parse(rawPayload);

    if (data.exp && data.exp < Date.now()) {
      return null;
    }

    return data as SessionData;
  } catch {
    return null;
  }
}

/**
 * Get session in Server Components / Actions / API Routes (Async for Next.js 15)
 */
export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * Set session cookie (Async for Next.js 15)
 */
export async function setSession(data: SessionData): Promise<void> {
  const token = createSessionToken(data);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 14 * 24 * 60 * 60,
    path: '/',
  });
}

/**
 * Clear session cookie (Async for Next.js 15)
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
