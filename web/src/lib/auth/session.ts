import 'server-only';
import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';

export const SESSION_COOKIE = 'plant_sync_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('AUTH_SECRET must be set to a random string of at least 32 characters');
  }
  return new TextEncoder().encode(secret);
}

export async function verifySessionToken(token?: string): Promise<{ userId: string } | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ['HS256'] });
    return payload.sub ? { userId: payload.sub } : null;
  } catch {
    return null;
  }
}

export async function createSession(userId: string) {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secretKey());

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    // The ESP32 setup is often plain HTTP on a LAN; only mark the cookie
    // secure when the app is configured with an https URL.
    secure: (process.env.NEXT_PUBLIC_APP_URL ?? '').startsWith('https://'),
    path: '/',
    maxAge: SESSION_MAX_AGE
  });
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}
