'use client'

import { useState } from 'react'

type Props = {
  source?: string
  trigger?: 'link' | 'button'
  label?: string
  className?: string
}

export function ContactForm({
  source = 'help',
  trigger = 'link',
  label = 'כתוב לנו',
  className,
}: Props) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [hp, setHp] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!message.trim()) { setError('יש לכתוב הודעה'); return }
    setSending(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message.trim(),
          name: name || undefined,
          email: email || undefined,
          source,
          _hp: hp,
        }),
      })
      if (!res.ok) {
        setError('שליחה נכשלה — נסה שוב')
        return
      }
      setSent(true)
      setTimeout(() => {
        setOpen(false)
        setSent(false)
        setMessage('')
        setName('')
        setEmail('')
      }, 1800)
    } catch {
      setError('שגיאת רשת — נסה שוב')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className ?? (trigger === 'button'
          ? 'bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors'
          : 'text-blue-600 hover:underline font-medium')}
      >
        {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4"
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 overflow-y-auto max-h-[calc(100vh-2rem)]" dir="rtl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">פנייה לתמיכה</h2>
              <button onClick={() => setOpen(false)} aria-label="סגור" className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            {sent ? (
              <div className="text-center py-8 space-y-2">
                <div className="text-3xl">✓</div>
                <p className="text-sm font-medium text-gray-900">ההודעה נשלחה!</p>
                <p className="text-xs text-gray-500">נחזור אליך בהקדם</p>
              </div>
            ) : (
              <form onSubmit={(e) => void submit(e)} className="space-y-3">
                <input
                  type="text"
                  value={hp}
                  onChange={e => setHp(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  className="hidden"
                  aria-hidden="true"
                />

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label htmlFor="contact-name" className="text-xs font-medium text-gray-700">שם (אופציונלי)</label>
                    <input
                      id="contact-name"
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="contact-email" className="text-xs font-medium text-gray-700">מייל (אופציונלי)</label>
                    <input
                      id="contact-email"
                      type="email"
                      dir="ltr"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="contact-message" className="text-xs font-medium text-gray-700">הודעה</label>
                  <textarea
                    id="contact-message"
                    required
                    rows={5}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="במה אפשר לעזור?"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 text-red-700 text-sm rounded-xl px-3 py-2 border border-red-200">
                    {error}
                  </div>
                )}

                <p className="text-xs text-gray-400">
                  אם אתה מחובר, נשלח גם את פרטי החשבון שלך כדי שנוכל לעזור מהר יותר.
                </p>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    ביטול
                  </button>
                  <button
                    type="submit"
                    disabled={sending}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                  >
                    {sending ? 'שולח...' : 'שלח'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
