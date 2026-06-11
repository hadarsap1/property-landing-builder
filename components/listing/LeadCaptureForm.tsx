'use client';

import { useState } from 'react';

export default function LeadCaptureForm({
  listingId,
  agencyId,
  accent,
  heroText,
}: {
  listingId: string;
  agencyId: string;
  accent: string;
  heroText: string;
}) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', _hp: '' });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
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
          email: form.email.trim() || null,
          source: 'direct',
          _hp: form._hp,
        }),
      });
      if (res.ok) setDone(true);
      else setError('שגיאה, נסה שוב');
    } catch {
      setError('שגיאה, נסה שוב');
    }
    setSaving(false);
  }

  if (done) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center space-y-2">
        <div className="text-3xl">✅</div>
        <p className="font-semibold" style={{ color: heroText }}>תודה! נחזור אליך בהקדם</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 space-y-3 text-right"
    >
      <p className="text-sm font-medium mb-1" style={{ color: heroText }}>
        השאר פרטים ונחזור אליך
      </p>
      <input
        type="text"
        placeholder="שם מלא"
        aria-label="שם מלא"
        value={form.name}
        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        className="w-full bg-white/20 border border-white/30 rounded-xl px-4 py-2.5 text-sm placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
        style={{ color: heroText }}
      />
      <input
        type="tel"
        placeholder="טלפון"
        aria-label="מספר טלפון"
        value={form.phone}
        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
        className="w-full bg-white/20 border border-white/30 rounded-xl px-4 py-2.5 text-sm placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
        style={{ color: heroText }}
        dir="ltr"
      />
      <input
        type="email"
        placeholder="מייל (אופציונלי)"
        aria-label="כתובת מייל (אופציונלי)"
        value={form.email}
        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
        className="w-full bg-white/20 border border-white/30 rounded-xl px-4 py-2.5 text-sm placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
        style={{ color: heroText }}
        dir="ltr"
      />
      {/* Honeypot — hidden from humans, filled by bots */}
      <input
        type="text"
        name="website"
        value={form._hp}
        onChange={e => setForm(f => ({ ...f, _hp: e.target.value }))}
        autoComplete="off"
        tabIndex={-1}
        aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0 }}
      />
      {error && <p className="text-sm text-red-300">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="w-full font-semibold py-3 rounded-xl text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{ backgroundColor: accent }}
      >
        {saving ? 'שולח...' : 'שלח פרטים'}
      </button>
      <p className="text-xs opacity-60 text-center leading-relaxed" style={{ color: heroText }}>
        בשליחת הטופס אתה מסכים לאיסוף פרטיך לצורך חזרה אליך בנוגע לנכס זה, בהתאם ל
        <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline">מדיניות הפרטיות</a>
        .
      </p>
    </form>
  );
}
