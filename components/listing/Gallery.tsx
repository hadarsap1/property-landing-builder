'use client';

import { useState, useEffect } from 'react';
import type { PropertyProject, StoredImage } from '@/types/project';

function Lightbox({ images, index, onClose, onNavigate }: {
  images: StoredImage[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      // RTL: ArrowRight goes to previous image, ArrowLeft to next
      if (e.key === 'ArrowRight') onNavigate((index - 1 + images.length) % images.length);
      if (e.key === 'ArrowLeft') onNavigate((index + 1) % images.length);
    }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [index, images.length, onClose, onNavigate]);

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="גלריית תמונות במסך מלא"
      onClick={onClose}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={images[index].dataUrl}
        alt={images[index].name}
        className="max-w-full max-h-full object-contain select-none"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 left-4 text-white/80 hover:text-white text-4xl leading-none w-12 h-12 flex items-center justify-center"
        aria-label="סגור"
      >
        ×
      </button>
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onNavigate((index - 1 + images.length) % images.length); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/25 text-white w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-colors"
            aria-label="הקודם"
          >
            ›
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onNavigate((index + 1) % images.length); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/25 text-white w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-colors"
            aria-label="הבא"
          >
            ‹
          </button>
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/80 text-sm bg-black/40 px-3 py-1 rounded-full">
            {index + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  );
}

export default function Gallery({ images, galleryType }: {
  images: StoredImage[];
  galleryType: PropertyProject['galleryType'];
}) {
  const [current, setCurrent] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const isCarousel = galleryType !== 'grid';
  const isAuto = galleryType.startsWith('auto-');
  const intervalMs = isAuto
    ? parseInt(galleryType.replace('auto-', '').replace('s', '')) * 1000
    : 0;

  useEffect(() => {
    if (!isAuto || images.length <= 1) return;
    const timer = setInterval(() => setCurrent((c) => (c + 1) % images.length), intervalMs);
    return () => clearInterval(timer);
  }, [isAuto, intervalMs, images.length]);

  const lightbox = lightboxIndex !== null && (
    <Lightbox
      images={images}
      index={lightboxIndex}
      onClose={() => setLightboxIndex(null)}
      onNavigate={setLightboxIndex}
    />
  );

  if (!isCarousel) {
    return (
      <>
      {lightbox}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {images.map((img, idx) => (
          <button
            key={img.id}
            type="button"
            onClick={() => setLightboxIndex(idx)}
            className="block w-full cursor-zoom-in focus:outline-none focus:ring-2 rounded-xl"
            aria-label={`הצג תמונה ${idx + 1} במסך מלא`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.dataUrl}
              alt={img.name}
              loading="lazy"
              className="w-full aspect-video object-cover rounded-xl"
            />
          </button>
        ))}
      </div>
      </>
    );
  }

  return (
    <>
    {lightbox}
    <div className="relative overflow-hidden rounded-xl" style={{ aspectRatio: '16/9' }}>
      {images.map((img, idx) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={img.id}
          src={img.dataUrl}
          alt={img.name}
          onClick={() => setLightboxIndex(idx)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 cursor-zoom-in ${
            idx === current ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => setCurrent((c) => (c - 1 + images.length) % images.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-10 h-10 rounded-full flex items-center justify-center text-xl transition-colors"
            aria-label="הקודם"
          >
            ›
          </button>
          <button
            type="button"
            onClick={() => setCurrent((c) => (c + 1) % images.length)}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-10 h-10 rounded-full flex items-center justify-center text-xl transition-colors"
            aria-label="הבא"
          >
            ‹
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrent(idx)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  idx === current ? 'bg-white' : 'bg-white/40'
                }`}
                aria-label={`תמונה ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
      {/* Counter badge */}
      <div className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
        {current + 1} / {images.length}
      </div>
    </div>
    </>
  );
}
