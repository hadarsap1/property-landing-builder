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
  const [enhanceErrors, setEnhanceErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  // Keep a ref to current images length so the dynamic input closure stays fresh
  const imagesLenRef = useRef(project.images.length);

  // Keep ref in sync so the dynamic-input closure always reads the current length
  imagesLenRef.current = project.images.length;

  function openCamera(): void {
    if (imagesLenRef.current >= 10) return;
    // Create a fresh input each time — iOS WebKit blocks re-triggering an existing input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.setAttribute('capture', 'environment');
    input.style.cssText = 'position:fixed;top:-9999px;opacity:0;pointer-events:none';
    document.body.appendChild(input);
    input.onchange = () => {
      const files = input.files ? Array.from(input.files) : [];
      if (document.body.contains(input)) document.body.removeChild(input);
      if (files.length) void processFiles(files);
    };
    input.click();
  }

  async function processFiles(files: FileList | File[]): Promise<void> {
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

  function applyEnhancement(dataUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('canvas unavailable')); return; }
        // Real-estate standard: brighter, punchier, warmer
        ctx.filter = 'brightness(1.12) contrast(1.08) saturate(1.22)';
        ctx.drawImage(image, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      image.onerror = () => reject(new Error('image load failed'));
      image.src = dataUrl;
    });
  }

  async function enhanceImage(img: StoredImage): Promise<void> {
    setEnhancing((prev) => ({ ...prev, [img.id]: true }));
    setEnhanceErrors((prev) => { const next = { ...prev }; delete next[img.id]; return next; });
    try {
      const enhancedDataUrl = await applyEnhancement(img.dataUrl);
      const updated = project.images.map((i) =>
        i.id === img.id ? { ...i, enhancedDataUrl } : i
      );
      onChange({ images: updated });
    } catch (err) {
      console.error('[enhance]', err);
      setEnhanceErrors((prev) => ({ ...prev, [img.id]: 'שיפור נכשל, נסה שוב' }));
    } finally {
      setEnhancing((prev) => ({ ...prev, [img.id]: false }));
    }
  }

  function revertEnhancement(imgId: string): void {
    const updated = project.images.map((i) =>
      i.id === imgId ? { ...i, enhancedDataUrl: undefined } : i
    );
    onChange({ images: updated });
  }

  function moveImage(fromIdx: number, toIdx: number): void {
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

  function removeImage(id: string): void {
    const updated = project.images.filter((img) => img.id !== id);
    let heroIdx = project.heroImageIndex;
    const removedIdx = project.images.findIndex((img) => img.id === id);
    if (removedIdx === heroIdx) heroIdx = 0;
    else if (removedIdx < heroIdx) heroIdx = heroIdx - 1;
    onChange({ images: updated, heroImageIndex: Math.max(0, heroIdx) });
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>): void {
    e.preventDefault();
    setDragOver(false);
    void processFiles(e.dataTransfer.files);
  }

  function handleItemDragStart(idx: number): void {
    setDraggedIdx(idx);
  }

  function handleItemDrop(targetIdx: number): void {
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

  async function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'video/mp4') return;
    const url = URL.createObjectURL(file);
    onChange({ videoUrl: url });
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold" style={{ color: 'var(--pb-text)' }}>תמונות ומדיה</h2>

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
          style={{ background: 'var(--pb-surface2)', borderColor: dragOver ? 'var(--pb-accent)' : 'var(--pb-border)' }}
          className={`flex-1 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
            dragOver
              ? 'border-blue-500'
              : 'hover:border-blue-400'
          }`}
        >
          <div className="text-3xl mb-1">🖼️</div>
          <p className="font-medium text-sm" style={{ color: 'var(--pb-text)' }}>
            <span className="hidden sm:inline">גרור או </span>לחץ לבחירה
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--pb-text2)' }}>
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

        {/* Camera capture — mobile only */}
        {project.images.length < 10 && (
          <button
            type="button"
            onClick={openCamera}
            className="md:hidden flex flex-col items-center justify-center gap-1 w-28 border-2 border-dashed rounded-xl hover:border-blue-400 transition-colors cursor-pointer"
            style={{ borderColor: 'var(--pb-border)', background: 'var(--pb-surface2)' }}
          >
            <span className="text-3xl">📷</span>
            <span className="text-xs font-medium" style={{ color: 'var(--pb-text2)' }}>צלם עכשיו</span>
          </button>
        )}
      </div>

      {/* Image grid — 2 cols on mobile for bigger touch targets, 3 cols on sm+ */}
      {project.images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {project.images.map((img, idx) => {
            const displaySrc = img.enhancedDataUrl ?? img.dataUrl;
            const isEnhancing = enhancing[img.id] ?? false;
            const isEnhanced = !!img.enhancedDataUrl;
            const enhanceError = enhanceErrors[img.id];

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
                  className="w-full h-32 object-cover"
                />

                {/* Enhanced badge */}
                {isEnhanced && (
                  <div className="absolute top-1 left-1 bg-purple-500 text-white text-[10px] px-1.5 py-0.5 rounded-full leading-none pointer-events-none">
                    ✨ שופר
                  </div>
                )}

                {/* Hero star badge */}
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

                {/* Inline enhance error */}
                {enhanceError && !isEnhancing && (
                  <div className="absolute top-0 inset-x-0 bg-red-600/90 text-white text-[10px] text-center px-1 py-1 leading-tight">
                    {enhanceError}
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

                {/* Mobile: always-visible bottom bar — large touch targets */}
                {!isEnhancing && (
                  <div className="absolute bottom-0 inset-x-0 flex md:hidden">
                    {/* Hero toggle — left third */}
                    <button
                      type="button"
                      onClick={() => onChange({ heroImageIndex: idx })}
                      className={`flex-1 h-10 flex items-center justify-center text-lg transition-colors ${
                        project.heroImageIndex === idx
                          ? 'bg-yellow-400'
                          : 'bg-black/55'
                      }`}
                      aria-label="הגדר כראשי"
                    >
                      ⭐
                    </button>
                    {/* AI enhance — middle third */}
                    <button
                      type="button"
                      onClick={() => isEnhanced ? revertEnhancement(img.id) : void enhanceImage(img)}
                      className={`flex-1 h-10 flex items-center justify-center text-lg transition-colors ${
                        isEnhanced ? 'bg-gray-700' : 'bg-purple-700/80'
                      }`}
                      aria-label={isEnhanced ? 'בטל שיפור' : 'שפר עם AI'}
                    >
                      {isEnhanced ? '↩' : '✨'}
                    </button>
                    {/* Delete — right third */}
                    <button
                      type="button"
                      onClick={() => removeImage(img.id)}
                      className="flex-1 h-10 flex items-center justify-center text-lg bg-black/55 active:bg-red-600 transition-colors"
                      aria-label="מחק תמונה"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Take-another camera cell — mobile only, always last in grid */}
          {project.images.length < 10 && (
            <button
              type="button"
              onClick={openCamera}
              className="md:hidden h-32 rounded-lg border-2 border-dashed border-blue-300 bg-blue-50 flex flex-col items-center justify-center gap-1 active:bg-blue-100 transition-colors"
            >
              <span className="text-3xl">📷</span>
              <span className="text-xs text-blue-600 font-semibold">צלם עוד</span>
            </button>
          )}
        </div>
      )}

      {/* Reorder hint — desktop only */}
      {project.images.length > 1 && (
        <p className="hidden sm:block text-xs text-center" style={{ color: 'var(--pb-text2)' }}>
          גרור תמונות לסידור מחדש. התמונה הראשונה תהיה הכותרת.
        </p>
      )}

      {/* Gallery type */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--pb-text2)' }}>סוג גלריה</label>
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
              <span style={{ color: 'var(--pb-text)' }}>{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Video upload */}
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--pb-text2)' }}>
          סרטון (אופציונלי){' '}
          <span style={{ color: 'var(--pb-text2)', fontWeight: 400 }}>MP4 בלבד</span>
        </label>
        <input
          ref={videoInputRef}
          type="file"
          accept="video/mp4"
          onChange={(e) => void handleVideoUpload(e)}
          className="block text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          style={{ color: 'var(--pb-text2)' }}
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
