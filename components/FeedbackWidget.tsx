'use client';

import { useState, useRef, useEffect } from 'react';

type FeedbackType = 'bug' | 'suggestion';

function compressImage(file: File, maxWidth = 1280, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('no canvas')); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('load failed')); };
    img.src = url;
  });
}

export default function FeedbackWidget({ direction = 'up' }: { direction?: 'up' | 'down' }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>('suggestion');
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState('');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [screenshotName, setScreenshotName] = useState('');
  const [compressing, setCompressing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) textareaRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCompressing(true);
    try {
      const compressed = await compressImage(file);
      setScreenshot(compressed);
      setScreenshotName(file.name);
    } catch { /* screenshot is optional */ }
    finally {
      setCompressing(false);
      e.target.value = '';
    }
  }

  function removeScreenshot() {
    setScreenshot(null);
    setScreenshotName('');
  }

  function reset() {
    setMessage('');
    setContact('');
    setScreenshot(null);
    setScreenshotName('');
    setStatus('idle');
  }

  async function submit() {
    if (!message.trim()) return;
    setStatus('sending');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, message: message.trim(), contact: contact.trim(), screenshot }),
      });
      if (!res.ok) throw new Error();
      setStatus('sent');
      setTimeout(() => { setOpen(false); reset(); }, 2200);
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="relative" dir="rtl">
      {/* Trigger — inline in the bottom bar */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => { setOpen((v) => !v); setStatus('idle'); }}
        className="flex items-center gap-1 text-gray-400 hover:text-gray-600 text-xs font-medium transition-colors"
        aria-label="Talk to us"
      >
        <span className="text-base leading-none">💬</span>
        Talk to us
      </button>

      {open && (
        <div
          ref={panelRef}
          className={`absolute ${direction === 'up' ? 'bottom-full mb-3' : 'top-full mt-3'} left-1/2 -translate-x-1/2 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden`}
        >
          {status === 'sent' ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10 px-6 text-center">
              <span className="text-4xl">{type === 'bug' ? '🐛' : '💡'}</span>
              <p className="font-bold text-gray-900 text-base">
                {type === 'bug' ? 'קיבלנו את הדיווח!' : 'הצעה מעולה, תודה!'}
              </p>
              <p className="text-sm text-gray-500 leading-relaxed">
                {type === 'bug'
                  ? 'נבדוק את זה בהקדם ונתקן.\nאתה עוזר לנו לשפר את הכלי.'
                  : 'הרעיון שלך ישמש אותנו בפיתוח הבא.\nמעריכים שלקחת רגע לכתוב.'}
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-800">שלח משוב</p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                  aria-label="סגור"
                >×</button>
              </div>

              <div className="p-4 space-y-3">
                {/* Type toggle */}
                <div className="flex gap-2">
                  {([
                    { value: 'suggestion', label: '💡 הצעה / שאלה' },
                    { value: 'bug',        label: '🐛 דיווח על באג' },
                  ] as const).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => { setType(opt.value); if (opt.value !== 'bug') removeScreenshot(); }}
                      className={`flex-1 text-xs font-medium py-2 px-2 rounded-lg border transition-all ${
                        type === opt.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Message */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {type === 'bug' ? 'מה קרה? איפה?' : 'מה יש לך בראש?'}
                  </label>
                  <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={type === 'bug' ? 'תאר את הבאג — באיזה שלב, מה ניסית לעשות...' : 'רעיון, שאלה, בקשה לפיצ׳ר...'}
                    rows={4}
                    maxLength={2000}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-gray-300"
                  />
                </div>

                {/* Screenshot — bug only */}
                {type === 'bug' && (
                  <div>
                    <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={handleFile} />
                    {!screenshot ? (
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        disabled={compressing}
                        className="w-full flex items-center justify-center gap-2 border border-dashed border-gray-300 rounded-xl py-2 text-xs text-gray-500 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-40"
                      >
                        <span className="text-base">📎</span>
                        {compressing ? 'מכין תמונה...' : 'צרף צילום מסך (אופציונלי)'}
                      </button>
                    ) : (
                      <div className="relative rounded-xl overflow-hidden border border-gray-200 group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={screenshot} alt="צילום מסך" className="w-full max-h-36 object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <button
                            type="button"
                            onClick={removeScreenshot}
                            className="opacity-0 group-hover:opacity-100 bg-white rounded-full px-3 py-1 text-xs font-medium text-red-500 shadow transition-opacity"
                          >הסר</button>
                        </div>
                        <p className="px-3 py-1.5 text-xs text-gray-400 bg-gray-50 truncate border-t border-gray-100">
                          📎 {screenshotName}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Contact */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    מייל / טלפון לחזרה <span className="font-normal text-gray-400">(אופציונלי)</span>
                  </label>
                  <input
                    type="text"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="אם רוצה תשובה..."
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-gray-300"
                  />
                </div>

                {status === 'error' && <p className="text-xs text-red-500">משהו השתבש, נסה שוב</p>}

                <button
                  type="button"
                  onClick={() => void submit()}
                  disabled={!message.trim() || status === 'sending' || compressing}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                >
                  {status === 'sending' ? 'שולח...' : 'שלח'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
