'use client';

import { useState, useCallback, useSyncExternalStore } from 'react';
import type { TemplateTheme } from './theme';

const noopSubscribe = () => () => {};

export default function ShareBar({ shareCode, title, openHouseDate, theme }: {
  shareCode: string;
  title: string;
  openHouseDate?: string;
  theme: TemplateTheme;
}) {
  // window.location is unavailable during SSR — empty server snapshot, real URL on the client
  const shareUrl = useSyncExternalStore(
    noopSubscribe,
    () => `${window.location.origin}/preview/${shareCode}`,
    () => ''
  );
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if (!shareUrl) return;
    void navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }, [shareUrl]);

  if (!shareUrl) return null;

  const waText = [
    `🏠 ${title}`,
    openHouseDate && new Date(openHouseDate).getTime() > Date.now()
      ? `🗓️ בית פתוח: ${new Date(openHouseDate).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })} בשעה ${new Date(openHouseDate).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`
      : null,
    shareUrl,
  ].filter(Boolean).join('\n');

  return (
    <div
      dir="rtl"
      className="fixed bottom-0 right-0 left-0 z-50 flex flex-wrap items-center justify-center gap-2 px-4 py-3 shadow-2xl border-t"
      style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
    >
      <span className="hidden sm:inline text-sm font-medium me-2" style={{ color: theme.mutedText }}>
        שתף דף זה:
      </span>
      {/* WhatsApp */}
      <a
        href={`https://wa.me/?text=${encodeURIComponent(waText)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors shadow-sm"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current flex-shrink-0" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        WhatsApp
      </a>
      {/* Copy link */}
      <button
        type="button"
        onClick={handleCopy}
        className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full transition-colors shadow-sm border"
        style={{
          backgroundColor: copied ? '#dcfce7' : theme.pageBg,
          color: copied ? '#16a34a' : theme.pageText,
          borderColor: copied ? '#86efac' : theme.cardBorder,
        }}
      >
        {copied ? (
          <>✓ הועתק</>
        ) : (
          <>
            <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            העתק קישור
          </>
        )}
      </button>
      {/* Email */}
      <a
        href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`שלום,\nמצורף קישור לנכס:\n${shareUrl}`)}`}
        className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full transition-colors shadow-sm border"
        style={{ backgroundColor: theme.pageBg, color: theme.pageText, borderColor: theme.cardBorder }}
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        מייל
      </a>
    </div>
  );
}
