'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/** Re-runs the server components of the current page on an interval (live dashboard). */
export function AutoRefresh({ intervalMs = 10000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') router.refresh();
    }, intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);
  return null;
}
