'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  followups?: string[]
}

const QUICK_QUESTIONS = [
  'כמה קומות יש בבניין?',
  'האם יש חניה?',
  'האם יש מחסן?',
  'האם יש מעלית?',
  'האם יש ממ"ד?',
  'מה שנת הבנייה?',
  'מה הכיוון של הדירה?',
  'כמה ארנונה?',
]

export default function PropertyChat({
  listingId,
  accent = '#2563eb',
}: {
  listingId: string
  accent?: string
}) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150)
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    const userMsg: Message = { role: 'user', content: trimmed }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/listings/${listingId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: messages.slice(-8).map(m => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await res.json() as { reply?: string; followups?: string[]; error?: string }
      if (res.status === 429) {
        setError('הגעת למגבלת השאלות להיום. נסה מחר.')
      } else if (data.reply) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.reply!,
          followups: data.followups ?? [],
        }])
      } else {
        setError('אירעה שגיאה, נסה שוב.')
      }
    } catch {
      setError('אירעה שגיאה, נסה שוב.')
    } finally {
      setLoading(false)
    }
  }, [listingId, loading, messages])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    void sendMessage(input)
  }

  const isEmpty = messages.length === 0

  return (
    <>
      {/* Floating bubble + tooltip wrapper */}
      <div className="group fixed bottom-6 left-6 z-50">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          aria-label="שאל שאלה על הנכס"
          className="flex items-center justify-center w-14 h-14 rounded-full shadow-xl transition-transform hover:scale-110 active:scale-95"
          style={{ backgroundColor: accent }}
        >
          {open ? (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          )}
        </button>

        {/* Tooltip on hover when closed */}
        {!open && (
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity">
            שאל שאלה על הנכס
          </div>
        )}
      </div>

      {/* Chat panel */}
      {open && (
        <div
          dir="rtl"
          className="fixed bottom-24 left-4 z-50 flex flex-col w-[min(360px,calc(100vw-2rem))] rounded-2xl shadow-2xl overflow-hidden border border-gray-200"
          style={{ maxHeight: 'min(520px, calc(100vh - 10rem))' }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-3 shrink-0"
            style={{ backgroundColor: accent }}
          >
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-lg shrink-0">
              🤖
            </div>
            <div className="text-white flex-1 min-w-0">
              <p className="text-sm font-semibold leading-tight">שאל על הנכס</p>
              <p className="text-xs opacity-75 leading-tight">עוזר AI — עשוי לטעות, לא תחליף לייעוץ מקצועי</p>
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto bg-gray-50 p-3 space-y-3" style={{ minHeight: '200px' }}>
            {isEmpty && (
              <div className="text-center pt-2">
                <p className="text-xs text-gray-500 mb-3">שאל כל שאלה על הנכס</p>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {QUICK_QUESTIONS.map(q => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => void sendMessage(q)}
                      className="text-xs px-2.5 py-1.5 rounded-full border border-gray-300 bg-white text-gray-700 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => {
              const isLastAssistant = msg.role === 'assistant'
                && i === messages.length - 1
                && !loading
              return (
                <div key={i}>
                  <div className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                    <div
                      className={`max-w-[85%] text-sm leading-relaxed px-3 py-2 rounded-2xl whitespace-pre-line ${
                        msg.role === 'user'
                          ? 'bg-white border border-gray-200 text-gray-800 rounded-tr-sm'
                          : 'text-white rounded-tl-sm'
                      }`}
                      style={msg.role === 'assistant' ? { backgroundColor: accent } : {}}
                    >
                      {msg.content}
                    </div>
                  </div>
                  {isLastAssistant && msg.followups && msg.followups.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5 justify-end">
                      {msg.followups.map((q, fi) => (
                        <button
                          key={fi}
                          type="button"
                          onClick={() => void sendMessage(q)}
                          className="text-xs px-2.5 py-1.5 rounded-full border bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {loading && (
              <div className="flex justify-end">
                <div
                  className="px-3 py-2 rounded-2xl rounded-tl-sm text-white"
                  style={{ backgroundColor: accent }}
                >
                  <span className="inline-flex gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/70 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-white/70 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-white/70 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              </div>
            )}

            {error && (
              <p className="text-xs text-red-500 text-center">{error}</p>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 px-3 py-2 bg-white border-t border-gray-200 shrink-0"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="שאל שאלה..."
              disabled={loading}
              className="flex-1 text-sm bg-gray-100 rounded-xl px-3 py-2 outline-none focus:ring-2 text-gray-800 placeholder-gray-400 disabled:opacity-50"
              style={{ '--tw-ring-color': accent } as React.CSSProperties}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-opacity hover:opacity-80 disabled:opacity-30 shrink-0"
              style={{ backgroundColor: accent }}
              aria-label="שלח"
            >
              <svg className="w-4 h-4 text-white rotate-180" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  )
}
