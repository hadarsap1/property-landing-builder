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
    // Appear after the visitor scrolls past the hero — don't compete with the hero CTA
    function onScroll() {
      setVisible(window.scrollY > window.innerHeight * 0.7);
    }
    // Initial check runs in rAF so state isn't set synchronously inside the effect
    const raf = requestAnimationFrame(onScroll);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  if (!phone && !whatsappUrl) return null;

  return (
    <div
      dir="rtl"
      className={`fixed bottom-0 right-0 left-0 z-50 flex sm:hidden transition-transform duration-300 shadow-[0_-4px_20px_rgba(0,0,0,0.15)] ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      {phone && (
        <a
          href={`tel:${phone.replace(/\s/g, '')}`}
          onClick={() => track('phone_click')}
          className="flex-1 flex items-center justify-center gap-2 text-white font-bold py-4 text-base"
          style={{ backgroundColor: accent }}
        >
          📞 התקשר
        </a>
      )}
      {whatsappUrl && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track('whatsapp_click')}
          className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white font-bold py-4 text-base"
        >
          💬 WhatsApp
        </a>
      )}
    </div>
  );
}
