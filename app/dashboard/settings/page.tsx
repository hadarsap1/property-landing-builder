'use client'

import { useState, useEffect, useRef } from 'react'
import type { Agency } from '@/lib/db/types'

export default function SettingsPage() {
  const [agency, setAgency] = useState<Agency | null>(null)
  const [form, setForm] = useState({
    name: '', primary_color: '#2563eb', secondary_color: '#1e3a5f',
    contact_email: '', contact_phone: '', logo_url: '', custom_domain: '',
  })
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    void fetch('/api/agency')
      .then(r => r.json())
      .then((d: { agency?: Agency }) => {
        if (d.agency) {
          setAgency(d.agency)
          setForm({
            name: d.agency.name ?? '',
            primary_color: d.agency.primary_color ?? '#2563eb',
            secondary_color: d.agency.secondary_color ?? '#1e3a5f',
            contact_email: d.agency.contact_email ?? '',
            contact_phone: d.agency.contact_phone ?? '',
            logo_url: d.agency.logo_url ?? '',
            custom_domain: d.agency.custom_domain ?? '',
          })
        }
      })
      .catch((err: unknown) => console.error('[settings] Failed to load agency:', err))
  }, [])

  async function uploadLogo(file: File) {
    setLogoUploading(true)
    const fd = new FormData(); fd.append('file', file)
    const res = await fetch('/api/blob/upload', { method: 'POST', body: fd })
    if (res.ok) {
      const { url } = (await res.json()) as { url: string }
      setForm(f => ({ ...f, logo_url: url }))
    }
    setLogoUploading(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaveError(null)
    const res = await fetch('/api/agency', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setSaved(true); setTimeout(() => setSaved(false), 2500)
    } else {
      const d = (await res.json().catch(() => ({}))) as { error?: string }
      setSaveError(d.error ?? 'שגיאה בשמירה')
    }
    setSaving(false)
  }

  const inputStyle: React.CSSProperties = {
    border: '2px solid #111',
    background: '#f7f5f2',
    borderRadius: '8px',
  }

  if (!agency) return (
    <div className="max-w-xl space-y-6 animate-pulse">
      <div className="h-7 w-40 rounded" style={{ background: '#e5e5e5' }} />
      <div className="p-5 space-y-4" style={{ background: '#fff', border: '2px solid #111', borderRadius: '8px' }}>
        <div className="h-14 w-28 rounded-lg" style={{ background: '#e5e5e5' }} />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-3 w-20 rounded" style={{ background: '#e5e5e5' }} />
            <div className="h-10 rounded-xl" style={{ background: '#f3f4f6' }} />
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-xl font-bold" style={{ color: '#111' }}>הגדרות סוכנות</h1>

      <form onSubmit={(e) => void handleSave(e)} className="space-y-5">

        {/* Logo */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#111' }}>לוגו</label>
          <div className="flex items-center gap-4">
            {form.logo_url ? (
              <img src={form.logo_url} alt="לוגו" className="h-14 w-auto object-contain rounded-lg p-1" style={{ border: '2px solid #111', background: '#fff' }} />
            ) : (
              <div className="h-14 w-14 rounded-lg flex items-center justify-center text-xl" style={{ border: '2px dashed #111', color: '#aaa' }}>🏢</div>
            )}
            <div>
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={logoUploading}
                className="text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                style={{ background: '#f7f5f2', border: '2px solid #111', color: '#111' }}
              >
                {logoUploading ? 'מעלה...' : 'בחר קובץ'}
              </button>
              {form.logo_url && (
                <button type="button" onClick={() => setForm(f => ({ ...f, logo_url: '' }))}
                  className="mr-2 text-sm hover:underline" style={{ color: '#c0392b' }}>הסר</button>
              )}
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { if (e.target.files?.[0]) void uploadLogo(e.target.files[0]) }} />
            </div>
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#111' }}>שם הסוכנות</label>
          <input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            required
            className="w-full px-4 py-2.5 text-sm focus:outline-none"
            style={inputStyle}
          />
        </div>

        {/* Slug (read-only) */}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#111' }}>
            סאב-דומיין <span className="font-normal" style={{ color: '#aaa' }}>(קבוע)</span>
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm flex-1 font-mono px-4 py-2.5" style={{ background: '#f7f5f2', border: '2px solid #111', borderRadius: '8px', color: '#888' }} dir="ltr">
              {agency.slug}
            </span>
          </div>
          <p className="text-xs mt-1" style={{ color: '#aaa' }}>
            הסאב-דומיין משמש לניתוב: {agency.slug}.yourdomain.com
          </p>
        </div>

        {/* Custom domain */}
        <div>
          <label htmlFor="custom-domain" className="block text-sm font-medium mb-1" style={{ color: '#111' }}>
            דומיין מותאם אישית <span className="font-normal" style={{ color: '#aaa' }}>(אופציונלי)</span>
          </label>
          <input
            id="custom-domain"
            type="text"
            value={form.custom_domain}
            onChange={e => setForm(f => ({ ...f, custom_domain: e.target.value }))}
            placeholder="listings.my-agency.co.il"
            dir="ltr"
            className="w-full px-4 py-2.5 text-sm font-mono focus:outline-none"
            style={inputStyle}
          />
          <div className="text-xs mt-1.5 space-y-1" style={{ color: '#aaa' }}>
            <p>כדי לחבר דומיין משלכם:</p>
            <p>1. הוסיפו רשומת CNAME אצל ספק הדומיין שמצביעה אל <code className="px-1 rounded" style={{ background: '#f3f4f6' }} dir="ltr">cname.vercel-dns.com</code></p>
            <p>2. הזינו את הדומיין כאן ושמרו — דפי הנכסים שלכם יוגשו ממנו אוטומטית</p>
          </div>
        </div>

        {/* Colors */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#111' }}>צבע ראשי</label>
            <div className="flex items-center gap-2 px-3 py-2" style={{ border: '2px solid #111', borderRadius: '8px', background: '#f7f5f2' }}>
              <input type="color" value={form.primary_color}
                onChange={e => setForm(f => ({ ...f, primary_color: e.target.value }))}
                className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent" />
              <span className="text-sm font-mono" style={{ color: '#888' }}>{form.primary_color}</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#111' }}>צבע משני</label>
            <div className="flex items-center gap-2 px-3 py-2" style={{ border: '2px solid #111', borderRadius: '8px', background: '#f7f5f2' }}>
              <input type="color" value={form.secondary_color}
                onChange={e => setForm(f => ({ ...f, secondary_color: e.target.value }))}
                className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent" />
              <span className="text-sm font-mono" style={{ color: '#888' }}>{form.secondary_color}</span>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#111' }}>מייל ליצירת קשר</label>
            <input type="email" value={form.contact_email}
              onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))}
              className="w-full px-4 py-2.5 text-sm focus:outline-none"
              style={inputStyle}
              placeholder="office@agency.co.il" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#111' }}>טלפון</label>
            <input type="tel" value={form.contact_phone}
              onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))}
              className="w-full px-4 py-2.5 text-sm focus:outline-none"
              style={inputStyle}
              placeholder="03-1234567" dir="ltr" />
          </div>
        </div>

        {/* Preview swatch */}
        <div
          className="rounded-xl p-4 flex items-center gap-3"
          style={{ background: form.primary_color }}
        >
          {form.logo_url && (
            <img src={form.logo_url} alt="" className="h-8 object-contain" />
          )}
          <span className="text-white font-semibold">{form.name || 'שם הסוכנות'}</span>
        </div>

        {saveError && (
          <p className="text-sm rounded-lg p-3" style={{ color: '#991b1b', background: '#fef2f2', border: '1px solid #fecaca' }}>
            {saveError}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full font-semibold py-2.5 rounded-xl transition-colors text-sm disabled:opacity-50"
          style={{ background: '#111', color: '#f7f5f2' }}
        >
          {saving ? 'שומר...' : saved ? '✓ נשמר' : 'שמור שינויים'}
        </button>
      </form>
    </div>
  )
}
