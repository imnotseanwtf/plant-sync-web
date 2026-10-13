import { clerkMiddleware } from '@clerk/nextjs/server';

// Route protection lives in the /dashboard layout via `auth.protect()`.
// clerkMiddleware() only attaches the auth context to every request.
export default clerkMiddleware();
export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|api/store-sensor-values|api/irrigation-control|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes, except the ESP32 device endpoints (they use DEVICE_API_KEY)
    '/(api(?!/(?:store-sensor-values|irrigation-control)(?:/|$))|trpc)(.*)'
  ]
};
