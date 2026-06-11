'use client';

import { useState, useEffect } from 'react';

function googleCalendarUrl(title: string, address: string, startIso: string, endIso: string): string {
  const fmt = (iso: string) => iso.replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const start = fmt(startIso);
  // Default to a one-hour window when no end time was set
  const end = endIso ? fmt(endIso) : fmt(new Date(new Date(startIso).getTime() + 3_600_000).toISOString());
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `בית פתוח — ${title}`,
    dates: `${start}/${end}`,
    ...(address ? { location: address } : {}),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export default function OpenHouseBanner({ dateIso, endIso, title, address, accent, listingId, agencyId, track }: {
  dateIso: string;
  endIso: string;
  title: string;
  address: string;
  accent: string;
  listingId?: string;
  agencyId?: string;
  track: (event: string) => void;
}) {
  const [form, setForm] = useState({ name: '', phone: '' });
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Re-render every minute so the countdown stays fresh
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 60_000);
    return () => clearInterval(t);
  }, []);

  const start = new Date(dateIso);
  const msLeft = start.getTime() - Date.now();
  if (isNaN(start.getTime()) || msLeft < -3 * 3_600_000) return null; // hide 3h after start

  const days = Math.floor(msLeft / 86_400_000);
  const hours = Math.floor((msLeft % 86_400_000) / 3_600_000);
  const countdown =
    msLeft <= 0 ? 'מתקיים עכשיו!' :
    days > 0 ? `בעוד ${days} ימים ו-${hours} שעות` :
    hours > 0 ? `בעוד ${hours} שעות` : 'בקרוב!';

  const dateLabel = start.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' });
  const timeLabel = start.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  const endLabel = endIso
    ? new Date(endIso).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
    : '';

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() && !form.phone.trim()) {
      setError('נא למלא שם או טלפון');
      return;
    }
    setSaving(true); setError(null);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_id: listingId,
          agency_id: agencyId,
          name: form.name.trim() || null,
          phone: form.phone.trim() || null,
          source: 'open_house',
        }),
      });
      if (res.ok) {
        setDone(true);
        track('open_house_register');
      } else setError('שגיאה, נסה שוב');
    } catch {
      setError('שגיאה, נסה שוב');
    }
    setSaving(false);
  }

  return (
    <section className="py-10 px-6" style={{ background: accent }}>
      <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center gap-6 text-white">
        <div className="flex-1 text-center md:text-right">
          <p className="text-sm font-bold tracking-widest uppercase opacity-80 mb-1">🏠 בית פתוח</p>
          <p className="text-2xl font-bold">
            {dateLabel} בשעה {timeLabel}{endLabel ? `–${endLabel}` : ''}
          </p>
          <p className="text-base opacity-90 mt-1">{countdown}</p>
          <a
            href={googleCalendarUrl(title, address, dateIso, endIso)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-2 text-sm underline opacity-90 hover:opacity-100"
          >
            📅 הוסף ליומן Google
          </a>
        </div>

        {listingId && agencyId && (
          <div className="w-full md:w-72 shrink-0">
            {done ? (
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 text-center font-semibold">
                ✅ נרשמת! נתראה בבית הפתוח
              </div>
            ) : (
              <form onSubmit={(e) => void handleRegister(e)} className="bg-white/15 backdrop-blur-sm rounded-xl p-4 space-y-2">
                <p className="text-sm font-semibold">הירשמו לביקור</p>
                <input
                  type="text"
                  placeholder="שם"
                  aria-label="שם"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full bg-white/25 border border-white/40 rounded-lg px-3 py-2 text-sm text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/60"
                />
                <input
                  type="tel"
                  placeholder="טלפון"
                  aria-label="טלפון"
                  dir="ltr"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full bg-white/25 border border-white/40 rounded-lg px-3 py-2 text-sm text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/60"
                />
                {error && <p className="text-xs text-red-200">{error}</p>}
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-white font-bold py-2 rounded-lg text-sm transition-opacity hover:opacity-90 disabled:opacity-60"
                  style={{ color: accent }}
                >
                  {saving ? 'נרשם...' : 'אני מגיע/ה'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
