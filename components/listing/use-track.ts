'use client';

import { useRef, useCallback } from 'react';

/** Fire analytics events for a public listing page. No-op without listing/agency context. */
export function useTrack(listingId?: string, agencyId?: string) {
  const sessionId = useRef('');
  return useCallback((event: string) => {
    if (!listingId || !agencyId) return;
    // Lazy session id — generated on first event, not during render
    if (!sessionId.current) {
      sessionId.current = Math.random().toString(36).slice(2);
    }
    void fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, sessionId: sessionId.current, listingId, agencyId }),
    });
  }, [listingId, agencyId]);
}
