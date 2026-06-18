'use client';

import { useState, useEffect } from 'react';

export default function StickyContactBar({ phone, whatsappUrl, accent, track }: {
  phone: string;
  whatsappUrl: string;
  accent: string;
  track: (event: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() { setVisible(window.scrollY > window.innerHeight * 0.7); }
    const raf = requestAnimationFrame(onScroll);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', onScroll); };
  }, []);

  if (!phone && !whatsappUrl) return null;

  return (
    <div
      dir="rtl"
      className={`fixed bottom-0 right-0 left-0 z-50 flex sm:hidden transition-transform duration-300 ${visible ? 'translate-y-0' : 'translate-y-full'}`}
      style={{ borderTop: '2px solid #111' }}
    >
      {phone && (
        <a
          href={`tel:${phone.replace(/\s/g, '')}`}
          onClick={() => track('phone_click')}
          className="flex-1 flex items-center justify-center gap-2 font-bold py-4 text-sm"
          style={{ background: '#111', color: '#f7f5f2' }}
        >
          התקשרו
        </a>
      )}
      {whatsappUrl && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track('whatsapp_click')}
          className="flex-1 flex items-center justify-center gap-2 font-bold py-4 text-sm text-white"
          style={{ background: '#25D366', borderRight: phone ? '2px solid #111' : undefined }}
        >
          WhatsApp
        </a>
      )}
    </div>
  );
}
