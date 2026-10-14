import { NextResponse } from 'next/server';

/**
 * Optional shared-secret check for the ESP32 endpoints. When DEVICE_API_KEY is
 * unset the endpoints stay open, matching the Laravel app so existing firmware
 * keeps working until it is updated to send `X-Device-Key`.
 */
export function rejectUnauthorizedDevice(request: Request) {
  const key = process.env.DEVICE_API_KEY;
  if (!key || request.headers.get('x-device-key') === key) return null;
  return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
}
