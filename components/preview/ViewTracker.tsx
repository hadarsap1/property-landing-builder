'use client';

import { useEffect, useRef } from 'react';

interface Props {
  projectCode: string;
}

function getOrCreateViewerSession(): string {
  const KEY = 'viewer-session-id';
  let id = sessionStorage.getItem(KEY);
  if (!id) {
    id = `view-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem(KEY, id);
  }
  return id;
}

function postView(
  projectCode: string,
  viewerSessionId: string,
  extra: {
    contactClicked?: boolean;
    whatsappClicked?: boolean;
    durationSeconds?: number;
    referrer?: string;
  } = {}
) {
  void fetch('/api/view-project', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectCode, viewerSessionId, ...extra }),
  });
}

export default function ViewTracker({ projectCode }: Props) {
  const startRef = useRef(Date.now());
  const sessionId = useRef('');

  useEffect(() => {
    sessionId.current = getOrCreateViewerSession();
    const referrer = document.referrer || undefined;

    // Record the view on mount
    postView(projectCode, sessionId.current, { referrer });

    // Record duration on unload
    function handleUnload() {
      const duration = Math.round((Date.now() - startRef.current) / 1000);
      // Use sendBeacon for reliability on page close
      navigator.sendBeacon(
        '/api/view-project',
        JSON.stringify({
          projectCode,
          viewerSessionId: sessionId.current,
          durationSeconds: duration,
        })
      );
    }

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [projectCode]);

  // Expose helpers for contact/WhatsApp click tracking via custom events
  useEffect(() => {
    function onContact() {
      postView(projectCode, sessionId.current, { contactClicked: true });
    }
    function onWhatsApp() {
      postView(projectCode, sessionId.current, { whatsappClicked: true });
    }
    window.addEventListener('plb-contact-click', onContact);
    window.addEventListener('plb-whatsapp-click', onWhatsApp);
    return () => {
      window.removeEventListener('plb-contact-click', onContact);
      window.removeEventListener('plb-whatsapp-click', onWhatsApp);
    };
  }, [projectCode]);

  return null; // no visible output
}
