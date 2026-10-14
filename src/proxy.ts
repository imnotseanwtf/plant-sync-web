import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth/session';

// Only the dashboard and sign-in page go through here. The ESP32 endpoints
// (/api/store-sensor-values, /api/irrigation-control) authenticate with DEVICE_API_KEY instead.
export async function proxy(req: NextRequest) {
  const session = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/dashboard') && !session) {
    return NextResponse.redirect(new URL('/auth/sign-in', req.url));
  }
  if (pathname.startsWith('/auth') && session) {
    return NextResponse.redirect(new URL('/dashboard/overview', req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*']
};
