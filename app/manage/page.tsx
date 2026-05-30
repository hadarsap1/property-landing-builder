'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { PropertyStatus } from '@/types/project';

interface Info {
  title: string | null;
  status: PropertyStatus;
  listingType: 'sale' | 'rent';
}

const STATUS_OPTIONS: { value: PropertyStatus; label: string; hint: string }[] = [
  { value: 'available', label: '🟢 פעיל', hint: 'הנכס זמין — אנשים יכולים ליצור קשר' },
  { value: 'sold', label: '🔴 נמכר', hint: 'הדף יציג "נמכר" ויחסום יצירת קשר' },
  { value: 'rented', label: '🔴 הושכר', hint: 'הדף יציג "הושכר" ויחסום יצירת קשר' },
];

function ManageInner() {
  const params = useSearchParams();
  const initialCode = params.get('code') ?? '';
  const [code, setCode] = useState(/^\d{6}$/.test(initialCode) ? initialCode : '');
  const [info, setInfo] = useState<Info | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function lookup(c: string) {
    setError(null);
    setInfo(null);
    setSaved(false);
    if (!/^\d{6}$/.test(c)) {
      setError('יש להזין קוד בן 6 ספרות');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/project-status?code=${c}`);
      const data = (await res.json()) as Info & { error?: string };
      if (!res.ok) {
        setError(data.error ?? 'הנכס לא נמצא');
        return;
      }
      setInfo({ title: data.title, status: data.status, listingType: data.listingType });
    } catch {
      setError('שגיאה בטעינה, נסו שוב');
    } finally {
      setLoading(false);
    }
  }

  // Auto-lookup when arriving via /manage?code=123456. Deferred to a microtask
  // so no state is set synchronously in the effect body.
  useEffect(() => {
    if (/^\d{6}$/.test(initialCode)) queueMicrotask(() => void lookup(initialCode));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function update(status: PropertyStatus) {
    if (!info) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch('/api/project-status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, status }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? 'העדכון נכשל');
        return;
      }
      setInfo({ ...info, status });
      setSaved(true);
    } catch {
      setError('שגיאה בעדכון, נסו שוב');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div dir="rtl" lang="he" className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: 'var(--pb-bg)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🛠️</div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--pb-text)' }}>ניהול נכס</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--pb-text2)' }}>
            הזינו את קוד הנכס (6 ספרות) כדי לעדכן את הסטטוס שלו
          </p>
        </div>

        <div className="rounded-2xl p-6 space-y-4" style={{ background: 'var(--pb-surface)', border: '1px solid var(--pb-border)' }}>
          {/* Code entry */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void lookup(code.trim());
            }}
            className="flex gap-2"
          >
            <input
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              className="flex-1 text-center text-lg font-mono tracking-widest rounded-xl py-2.5 px-3"
              style={{ background: 'var(--pb-surface2)', border: '1px solid var(--pb-border)', color: 'var(--pb-text)' }}
              aria-label="קוד נכס"
            />
            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-100 disabled:text-gray-400 text-white font-semibold px-5 rounded-xl transition-colors"
            >
              {loading ? 'טוען...' : 'חפש'}
            </button>
          </form>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>
          )}

          {/* Status controls */}
          {info && (
            <div className="space-y-3 pt-1">
              <div className="text-sm" style={{ color: 'var(--pb-text2)' }}>
                נכס: <span className="font-semibold" style={{ color: 'var(--pb-text)' }}>{info.title || 'ללא כותרת'}</span>
              </div>
              <div className="space-y-2">
                {STATUS_OPTIONS.map((opt) => {
                  const active = info.status === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => void update(opt.value)}
                      disabled={saving}
                      aria-pressed={info.status === opt.value}
                      className="w-full text-start rounded-xl px-4 py-3 transition-colors disabled:opacity-60"
                      style={{
                        background: active ? 'color-mix(in srgb, var(--pb-accent) 12%, transparent)' : 'var(--pb-surface2)',
                        border: `2px solid ${active ? 'var(--pb-accent)' : 'transparent'}`,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold" style={{ color: 'var(--pb-text)' }}>{opt.label}</span>
                        {active && <span className="text-xs" style={{ color: 'var(--pb-accent)' }}>✓ נוכחי</span>}
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--pb-text2)' }}>{opt.hint}</p>
                    </button>
                  );
                })}
              </div>

              {saved && (
                <p className="text-sm text-green-700 bg-green-50 rounded-lg p-3">
                  ✓ הסטטוס עודכן. הדף הציבורי מתעדכן מיד.
                </p>
              )}

              <Link
                href={`/preview/${code}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center text-sm font-medium hover:underline"
                style={{ color: 'var(--pb-accent)' }}
              >
                צפה בדף הנכס ↗
              </Link>
            </div>
          )}
        </div>

        <p className="text-center mt-5">
          <Link href="/" className="text-sm hover:underline" style={{ color: 'var(--pb-text2)' }}>
            ← חזרה לדף הבית
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ManagePage() {
  return (
    <Suspense fallback={null}>
      <ManageInner />
    </Suspense>
  );
}
