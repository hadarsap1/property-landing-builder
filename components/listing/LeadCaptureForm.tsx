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
    if (!form.name.trim() && !form.phone.trim()) { setError('נא למלא שם או טלפון'); return; }
    setSaving(true); setError(null);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_id: listingId, agency_id: agencyId,
          name: form.name.trim() || null, phone: form.phone.trim() || null,
          email: form.email.trim() || null, source: 'direct', _hp: form._hp,
        }),
      });
      if (res.ok) setDone(true);
      else setError('שגיאה, נסה שוב');
    } catch { setError('שגיאה, נסה שוב'); }
    setSaving(false);
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.12)',
    border: '1px solid rgba(255,255,255,0.28)',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '14px',
    color: heroText,
    outline: 'none',
  };

  if (done) {
    return (
      <div className="rounded-lg p-6 text-center" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
        <p className="font-bold text-lg" style={{ color: heroText }}>תודה! נחזור אליכם בהקדם</p>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="rounded-lg p-6 space-y-3 text-right" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
      <p className="text-sm font-semibold mb-3" style={{ color: heroText }}>השאירו פרטים ונחזור אליכם</p>
      <input type="text" placeholder="שם מלא" aria-label="שם מלא" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} />
      <input type="tel" placeholder="טלפון" aria-label="מספר טלפון" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} style={inputStyle} dir="ltr" />
      <input type="email" placeholder="מייל (אופציונלי)" aria-label="כתובת מייל" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={inputStyle} dir="ltr" />
      <input type="text" name="website" value={form._hp} onChange={e => setForm(f => ({ ...f, _hp: e.target.value }))} autoComplete="off" tabIndex={-1} aria-hidden="true" style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0 }} />
      {error && <p className="text-sm" style={{ color: '#fca5a5' }}>{error}</p>}
      <button type="submit" disabled={saving} className="w-full font-bold py-3 rounded-lg text-white transition-opacity hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: accent }}>
        {saving ? 'שולח...' : 'שלח פרטים'}
      </button>
      <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
        בשליחה אתה מסכים ל<a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>מדיניות הפרטיות</a>.
      </p>
    </form>
  );
}
