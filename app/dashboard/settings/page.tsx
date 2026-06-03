'use client'

import { useState, useEffect, useRef } from 'react'
import type { Agency } from '@/lib/db/types'

export default function SettingsPage() {
  const [agency, setAgency] = useState<Agency | null>(null)
  const [form, setForm] = useState({
    name: '', primary_color: '#2563eb', secondary_color: '#1e3a5f',
    contact_email: '', contact_phone: '', logo_url: '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    void fetch('/api/agency').then(r => r.json()).then((d: { agency?: Agency }) => {
      if (d.agency) {
        setAgency(d.agency)
        setForm({
          name: d.agency.name ?? '',
          primary_color: d.agency.primary_color ?? '#2563eb',
          secondary_color: d.agency.secondary_color ?? '#1e3a5f',
          contact_email: d.agency.contact_email ?? '',
          contact_phone: d.agency.contact_phone ?? '',
          logo_url: d.agency.logo_url ?? '',
        })
      }
    })
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
    const res = await fetch('/api/agency', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500) }
    setSaving(false)
  }

  if (!agency) return (
    <div className="max-w-xl space-y-6 animate-pulse">
      <div className="h-7 w-40 bg-gray-200 rounded" />
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
        <div className="h-14 w-28 bg-gray-200 rounded-lg" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-3 w-20 bg-gray-200 rounded" />
            <div className="h-10 bg-gray-100 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-xl font-bold text-gray-900">הגדרות סוכנות</h1>

      <form onSubmit={(e) => void handleSave(e)} className="space-y-5">

        {/* Logo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">לוגו</label>
          <div className="flex items-center gap-4">
            {form.logo_url ? (
              <img src={form.logo_url} alt="לוגו" className="h-14 w-auto object-contain rounded-lg border border-gray-200 bg-white p-1" />
            ) : (
              <div className="h-14 w-14 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xl">🏢</div>
            )}
            <div>
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={logoUploading}
                className="text-sm bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {logoUploading ? 'מעלה...' : 'בחר קובץ'}
              </button>
              {form.logo_url && (
                <button type="button" onClick={() => setForm(f => ({ ...f, logo_url: '' }))}
                  className="mr-2 text-sm text-red-500 hover:text-red-700">הסר</button>
              )}
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { if (e.target.files?.[0]) void uploadLogo(e.target.files[0]) }} />
            </div>
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">שם הסוכנות</label>
          <input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            required
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Slug (read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            סאב-דומיין <span className="text-gray-400 font-normal">(קבוע)</span>
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm bg-gray-100 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-600 flex-1 font-mono" dir="ltr">
              {agency.slug}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            הסאב-דומיין משמש לניתוב: {agency.slug}.yourdomain.com
          </p>
        </div>

        {/* Colors */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">צבע ראשי</label>
            <div className="flex items-center gap-2 border border-gray-300 rounded-xl px-3 py-2">
              <input type="color" value={form.primary_color}
                onChange={e => setForm(f => ({ ...f, primary_color: e.target.value }))}
                className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent" />
              <span className="text-sm font-mono text-gray-600">{form.primary_color}</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">צבע משני</label>
            <div className="flex items-center gap-2 border border-gray-300 rounded-xl px-3 py-2">
              <input type="color" value={form.secondary_color}
                onChange={e => setForm(f => ({ ...f, secondary_color: e.target.value }))}
                className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent" />
              <span className="text-sm font-mono text-gray-600">{form.secondary_color}</span>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">מייל ליצירת קשר</label>
            <input type="email" value={form.contact_email}
              onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="office@agency.co.il" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">טלפון</label>
            <input type="tel" value={form.contact_phone}
              onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
        >
          {saving ? 'שומר...' : saved ? '✓ נשמר' : 'שמור שינויים'}
        </button>
      </form>
    </div>
  )
}
