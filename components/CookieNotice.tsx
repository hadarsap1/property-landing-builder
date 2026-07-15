'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const STORAGE_KEY = 'pb-cookie-notice-dismissed';

// Public landing pages are broker-branded and set no cookies — the privacy
// policy covers them; the notice is only for the platform (auth cookies,
// theme storage, Vercel Analytics).
const EXCLUDED_PREFIXES = ['/p/', '/preview/', '/agency/'];

export default function CookieNotice() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch { /* storage unavailable — keep hidden rather than nag every render */ }
  }, []);

  if (!visible) return null;
  if (EXCLUDED_PREFIXES.some((p) => pathname?.startsWith(p))) return null;

  function dismiss() {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* private mode */ }
    setVisible(false);
  }

  return (
    <div
      dir="rtl"
      role="region"
      aria-label="הודעת עוגיות"
      className="fixed bottom-3 right-3 left-3 sm:left-auto sm:max-w-sm z-50 bg-white text-gray-800 rounded-2xl shadow-2xl border border-gray-200 p-4 text-sm leading-relaxed"
    >
      <p>
        האתר משתמש בעוגיות חיוניות לצורך התחברות והעדפות תצוגה, ובאנליטיקה תפעולית.
        פירוט מלא ב<Link href="/privacy" className="text-blue-600 hover:underline">מדיניות הפרטיות</Link>.
      </p>
      <button
        type="button"
        onClick={dismiss}
        className="mt-3 w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-5 py-2 rounded-xl transition-colors"
      >
        הבנתי
      </button>
    </div>
  );
}
