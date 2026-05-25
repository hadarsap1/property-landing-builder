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
  { value: 'grid', label: 'גלריה (grid)' },
  { value: 'manual-carousel', label: 'קרוסל ידני' },
  { value: 'auto-3s', label: 'קרוסל אוטומטי (3 שניות)' },
  { value: 'auto-5s', label: 'קרוסל אוטומטי (5 שניות)' },
  { value: 'auto-7s', label: 'קרוסל אוטומטי (7 שניות)' },
];

export default function Step4({ project, onChange }: StepProps) {
  const [dragOver, setDragOver] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          dragOver
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
        }`}
      >
        <div className="text-4xl mb-2">🖼️</div>
        <p className="text-gray-600 font-medium">גרור תמונות לכאן או לחץ לבחירה</p>
        <p className="text-sm text-gray-400 mt-1">
          JPG, PNG, WebP | עד 10 תמונות
          {project.images.length > 0 && ` (${project.images.length}/10 נבחרו)`}
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

      {/* Image grid */}
      {project.images.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {project.images.map((img, idx) => (
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
                src={img.dataUrl}
                alt={img.name}
                className="w-full h-28 object-cover"
              />
              {/* Hero star */}
              {project.heroImageIndex === idx && (
                <div className="absolute top-1 right-1 bg-yellow-400 rounded-full w-6 h-6 flex items-center justify-center text-sm">
                  ⭐
                </div>
              )}
              {/* Controls overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => onChange({ heroImageIndex: idx })}
                  title="הגדר כתמונה ראשית"
                  className="bg-yellow-400 text-xs text-white px-2 py-1 rounded"
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
            </div>
          ))}
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
