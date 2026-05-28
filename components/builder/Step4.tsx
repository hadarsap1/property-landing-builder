'use client';

import { useRef, useState } from 'react';
import type { PropertyProject, StoredImage } from '@/types/project';

interface StepProps {
  project: PropertyProject;
  onChange: (partial: Partial<PropertyProject>) => void;
}

async function resizeImage(file: File): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const max = 800;
      let { width, height } = img;
      if (width > max || height > max) {
        if (width > height) {
          height = (height / width) * max;
          width = max;
        } else {
          width = (width / height) * max;
          height = max;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.6));
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

const GALLERY_OPTIONS: { value: PropertyProject['galleryType']; label: string }[] = [
  { value: 'grid', label: 'גלריה' },
  { value: 'manual-carousel', label: 'קרוסלה ידנית' },
  { value: 'auto-3s', label: 'קרוסלה אוטומטית (3 שניות)' },
  { value: 'auto-5s', label: 'קרוסלה אוטומטית (5 שניות)' },
  { value: 'auto-7s', label: 'קרוסלה אוטומטית (7 שניות)' },
];

const PHOTO_TIPS = [
  { icon: '🏠', text: 'צלם את כל החדר — עמוד בפינה כדי לקבל זווית רחבה' },
  { icon: '💡', text: 'פתח תריסים והדלק כל האורות — תאורה טובה = תמונה טובה' },
  { icon: '📐', text: 'צלם מגובה החזה — לא מלמטה ולא מלמעלה' },
  { icon: '🪟', text: 'הימנע מצילום ישירות לכיוון חלון — האור יסנוור' },
  { icon: '🧹', text: 'סדר ונקה לפני — כרית עקומה נראית בתמונה' },
];

export default function Step4({ project, onChange }: StepProps) {
  const [dragOver, setDragOver] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [tipsOpen, setTipsOpen] = useState(false);
  const [enhancing, setEnhancing] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  async function processFiles(files: FileList | File[]) {
    const arr = Array.from(files).filter((f) =>
      ['image/jpeg', 'image/png', 'image/webp'].includes(f.type)
    );
    const remaining = 10 - project.images.length;
    const toProcess = arr.slice(0, remaining);

    const newImages: StoredImage[] = await Promise.all(
      toProcess.map(async (file) => ({
        id: `img-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        dataUrl: await resizeImage(file),
        name: file.name,
      }))
    );

    onChange({ images: [...project.images, ...newImages] });
  }

  async function enhanceImage(img: StoredImage) {
    setEnhancing((prev) => ({ ...prev, [img.id]: true }));
    try {
      const res = await fetch('/api/enhance-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageDataUrl: img.enhancedDataUrl ?? img.dataUrl }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { enhancedDataUrl } = (await res.json()) as { enhancedDataUrl: string };
      const updated = project.images.map((i) =>
        i.id === img.id ? { ...i, enhancedDataUrl } : i
      );
      onChange({ images: updated });
    } catch (err) {
      console.error('[enhance]', err);
      alert('שיפור התמונה נכשל. נסה שוב.');
    } finally {
      setEnhancing((prev) => ({ ...prev, [img.id]: false }));
    }
  }

  function revertEnhancement(imgId: string) {
    const updated = project.images.map((i) =>
      i.id === imgId ? { ...i, enhancedDataUrl: undefined } : i
    );
    onChange({ images: updated });
  }

  function moveImage(fromIdx: number, toIdx: number) {
    if (toIdx < 0 || toIdx >= project.images.length) return;
    const updated = [...project.images];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);
    let heroIdx = project.heroImageIndex;
    if (heroIdx === fromIdx) heroIdx = toIdx;
    else if (fromIdx < heroIdx && toIdx >= heroIdx) heroIdx--;
    else if (fromIdx > heroIdx && toIdx <= heroIdx) heroIdx++;
    onChange({ images: updated, heroImageIndex: heroIdx });
  }

  function removeImage(id: string) {
    const updated = project.images.filter((img) => img.id !== id);
    let heroIdx = project.heroImageIndex;
    const removedIdx = project.images.findIndex((img) => img.id === id);
    if (removedIdx === heroIdx) heroIdx = 0;
    else if (removedIdx < heroIdx) heroIdx = heroIdx - 1;
    onChange({ images: updated, heroImageIndex: Math.max(0, heroIdx) });
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    void processFiles(e.dataTransfer.files);
  }

  function handleItemDragStart(idx: number) {
    setDraggedIdx(idx);
  }

  function handleItemDrop(targetIdx: number) {
    if (draggedIdx === null || draggedIdx === targetIdx) return;
    const updated = [...project.images];
    const [moved] = updated.splice(draggedIdx, 1);
    updated.splice(targetIdx, 0, moved);
    let heroIdx = project.heroImageIndex;
    if (heroIdx === draggedIdx) heroIdx = targetIdx;
    else if (draggedIdx < heroIdx && targetIdx >= heroIdx) heroIdx--;
    else if (draggedIdx > heroIdx && targetIdx <= heroIdx) heroIdx++;
    onChange({ images: updated, heroImageIndex: heroIdx });
    setDraggedIdx(null);
  }

  async function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'video/mp4') return;
    const url = URL.createObjectURL(file);
    onChange({ videoUrl: url });
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">תמונות ומדיה</h2>

      {/* Photo tips */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 overflow-hidden">
        <button
          type="button"
          onClick={() => setTipsOpen((o) => !o)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-amber-800 hover:bg-amber-100 transition-colors"
        >
          <span>💡 טיפים לצילום נכס מקצועי</span>
          <span className="text-lg leading-none">{tipsOpen ? '▲' : '▼'}</span>
        </button>
        {tipsOpen && (
          <ul className="px-4 pb-4 space-y-2">
            {PHOTO_TIPS.map((tip) => (
              <li key={tip.text} className="flex items-start gap-2 text-sm text-amber-900">
                <span className="text-base leading-snug">{tip.icon}</span>
                <span>{tip.text}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Upload + Camera buttons */}
      <div className="flex gap-3">
        {/* Drop zone / file upload */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex-1 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
            dragOver
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
          }`}
        >
          <div className="text-3xl mb-1">🖼️</div>
          <p className="text-gray-600 font-medium text-sm">גרור או לחץ לבחירה</p>
          <p className="text-xs text-gray-400 mt-1">
            JPG, PNG, WebP | עד 10 תמונות
            {project.images.length > 0 && ` (${project.images.length}/10)`}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => { if (e.target.files) void processFiles(e.target.files); }}
          />
        </div>

        {/* Camera capture — mobile opens camera, desktop opens file picker */}
        {project.images.length < 10 && (
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-1 w-28 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer"
          >
            <span className="text-3xl">📷</span>
            <span className="text-xs text-gray-600 font-medium">צלם עכשיו</span>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => { if (e.target.files) void processFiles(e.target.files); }}
            />
          </button>
        )}
      </div>

      {/* Image grid */}
      {project.images.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {project.images.map((img, idx) => {
            const displaySrc = img.enhancedDataUrl ?? img.dataUrl;
            const isEnhancing = enhancing[img.id] ?? false;
            const isEnhanced = !!img.enhancedDataUrl;

            return (
              <div
                key={img.id}
                draggable
                onDragStart={() => handleItemDragStart(idx)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleItemDrop(idx)}
                className={`relative group rounded-lg overflow-hidden border-2 cursor-grab active:cursor-grabbing ${
                  project.heroImageIndex === idx
                    ? 'border-yellow-400'
                    : 'border-transparent'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={displaySrc}
                  alt={img.name}
                  className="w-full h-28 object-cover"
                />

                {/* Enhanced badge */}
                {isEnhanced && (
                  <div className="absolute top-1 left-1 bg-purple-500 text-white text-[10px] px-1.5 py-0.5 rounded-full leading-none pointer-events-none">
                    AI ✨
                  </div>
                )}

                {/* Hero star */}
                {project.heroImageIndex === idx && (
                  <div className="absolute top-1 right-1 bg-yellow-400 rounded-full w-5 h-5 flex items-center justify-center text-xs pointer-events-none">
                    ⭐
                  </div>
                )}

                {/* Loading overlay while enhancing */}
                {isEnhancing && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span className="text-white text-[10px]">משפר…</span>
                  </div>
                )}

                {/* Desktop: hover overlay */}
                {!isEnhancing && (
                  <div className="absolute inset-0 bg-black/40 hidden md:flex opacity-0 group-hover:opacity-100 transition-opacity flex-col items-center justify-center gap-1 p-1">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => onChange({ heroImageIndex: idx })}
                        title="הגדר כתמונה ראשית"
                        className="bg-yellow-400 text-[10px] text-white px-2 py-1 rounded"
                      >
                        ⭐ ראשי
                      </button>
                      <button
                        type="button"
                        onClick={() => removeImage(img.id)}
                        className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm leading-none"
                      >
                        ✕
                      </button>
                    </div>
                    {isEnhanced ? (
                      <button
                        type="button"
                        onClick={() => revertEnhancement(img.id)}
                        className="bg-gray-600 text-[10px] text-white px-2 py-1 rounded w-full"
                      >
                        ↩ בטל שיפור
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void enhanceImage(img)}
                        className="bg-purple-600 text-[10px] text-white px-2 py-1 rounded w-full"
                      >
                        ✨ שפר עם AI
                      </button>
                    )}
                  </div>
                )}

                {/* Mobile: always-visible bottom controls */}
                {!isEnhancing && (
                  <div className="absolute bottom-0 inset-x-0 flex md:hidden items-center justify-between px-1 py-1 bg-gradient-to-t from-black/60 to-transparent">
                    <div className="flex gap-0.5">
                      <button
                        type="button"
                        onClick={() => moveImage(idx, idx - 1)}
                        disabled={idx === 0}
                        className="w-6 h-6 rounded bg-white/80 disabled:opacity-30 flex items-center justify-center text-xs text-gray-800 leading-none"
                        aria-label="הזז שמאלה"
                      >‹</button>
                      <button
                        type="button"
                        onClick={() => moveImage(idx, idx + 1)}
                        disabled={idx === project.images.length - 1}
                        className="w-6 h-6 rounded bg-white/80 disabled:opacity-30 flex items-center justify-center text-xs text-gray-800 leading-none"
                        aria-label="הזז ימינה"
                      >›</button>
                    </div>
                    <div className="flex gap-0.5">
                      <button
                        type="button"
                        onClick={() => onChange({ heroImageIndex: idx })}
                        className={`w-6 h-6 rounded flex items-center justify-center text-xs leading-none ${
                          project.heroImageIndex === idx ? 'bg-yellow-400' : 'bg-white/80 text-gray-800'
                        }`}
                        aria-label="הגדר כראשי"
                      >⭐</button>
                      <button
                        type="button"
                        onClick={() => isEnhanced ? revertEnhancement(img.id) : void enhanceImage(img)}
                        className={`w-6 h-6 rounded flex items-center justify-center text-xs leading-none ${
                          isEnhanced ? 'bg-gray-500 text-white' : 'bg-purple-600 text-white'
                        }`}
                        aria-label={isEnhanced ? 'בטל שיפור' : 'שפר עם AI'}
                      >{isEnhanced ? '↩' : '✨'}</button>
                      <button
                        type="button"
                        onClick={() => removeImage(img.id)}
                        className="w-6 h-6 rounded bg-red-500/90 text-white flex items-center justify-center text-xs leading-none"
                        aria-label="מחק תמונה"
                      >✕</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Gallery type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">סוג גלריה</label>
        <div className="space-y-2">
          {GALLERY_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="galleryType"
                value={opt.value}
                checked={project.galleryType === opt.value}
                onChange={() => onChange({ galleryType: opt.value })}
                className="text-blue-600"
              />
              <span className="text-gray-700">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Video upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          סרטון (אופציונלי){' '}
          <span className="text-gray-400 font-normal">MP4 בלבד</span>
        </label>
        <input
          ref={videoInputRef}
          type="file"
          accept="video/mp4"
          onChange={(e) => void handleVideoUpload(e)}
          className="block text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        {project.videoUrl && (
          <p className="text-sm text-green-600 mt-1">
            ✓ סרטון נבחר{' '}
            <button
              type="button"
              className="text-red-500 underline mr-2"
              onClick={() => onChange({ videoUrl: '' })}
            >
              הסר
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
