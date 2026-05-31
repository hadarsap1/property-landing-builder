'use client'

import { useRef, useState } from 'react'
import type { PropertyProject, StoredImage } from '@/types/project'

interface StepProps {
  project: PropertyProject
  onChange: (partial: Partial<PropertyProject>) => void
}

// Resize and return a JPEG Blob ready for upload
async function resizeToBlob(file: File): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const max = 1200
      let { width, height } = img
      if (width > max || height > max) {
        if (width > height) { height = (height / width) * max; width = max }
        else { width = (width / height) * max; height = max }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width; canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
      canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.82)
      URL.revokeObjectURL(url)
    }
    img.src = url
  })
}

// Fallback: resize and return base64 DataURL
async function resizeToDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const max = 800
      let { width, height } = img
      if (width > max || height > max) {
        if (width > height) { height = (height / width) * max; width = max }
        else { width = (width / height) * max; height = max }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width; canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', 0.6))
      URL.revokeObjectURL(url)
    }
    img.src = url
  })
}

async function uploadImage(file: File): Promise<string> {
  try {
    const blob = await resizeToBlob(file)
    const fd = new FormData()
    fd.append('file', new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }))
    const res = await fetch('/api/blob/upload', { method: 'POST', body: fd })
    if (res.ok) {
      const { url } = (await res.json()) as { url: string }
      return url
    }
  } catch { /* fall through */ }
  // Blob API unavailable — use base64
  return resizeToDataUrl(file)
}

const GALLERY_OPTIONS: { value: PropertyProject['galleryType']; label: string }[] = [
  { value: 'grid', label: 'גלריה (grid)' },
  { value: 'manual-carousel', label: 'קרוסל ידני' },
  { value: 'auto-3s', label: 'קרוסל אוטומטי (3 שניות)' },
  { value: 'auto-5s', label: 'קרוסל אוטומטי (5 שניות)' },
  { value: 'auto-7s', label: 'קרוסל אוטומטי (7 שניות)' },
]

export default function Step4({ project, onChange }: StepProps) {
  const [dragOver, setDragOver] = useState(false)
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null)
  const [uploadingIds, setUploadingIds] = useState<Set<string>>(new Set())
  const fileInputRef = useRef<HTMLInputElement>(null)
  // Tracks the latest images array so parallel uploads don't clobber each other
  const latestImagesRef = useRef<StoredImage[]>(project.images)
  // Keep ref in sync with prop (parent may update between uploads)
  latestImagesRef.current = project.images

  async function processFiles(files: FileList | File[]) {
    const arr = Array.from(files).filter((f) =>
      ['image/jpeg', 'image/png', 'image/webp'].includes(f.type)
    )
    const remaining = 10 - project.images.length
    const toProcess = arr.slice(0, remaining)
    if (!toProcess.length) return

    // Add placeholders with local preview URLs immediately
    const placeholders: StoredImage[] = toProcess.map((file) => ({
      id: `img-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      dataUrl: URL.createObjectURL(file),
      name: file.name,
    }))
    const withPlaceholders = [...project.images, ...placeholders]
    latestImagesRef.current = withPlaceholders
    onChange({ images: withPlaceholders })
    setUploadingIds((prev) => new Set([...prev, ...placeholders.map((p) => p.id)]))

    // Upload each in parallel, swap placeholder URL for Blob URL when done
    await Promise.all(
      toProcess.map(async (file, i) => {
        const id = placeholders[i].id
        try {
          const dataUrl = await uploadImage(file)
          const updated = latestImagesRef.current.map((img) =>
            img.id === id ? { ...img, dataUrl } : img
          )
          latestImagesRef.current = updated
          onChange({ images: updated })
        } finally {
          setUploadingIds((prev) => { const s = new Set(prev); s.delete(id); return s })
        }
      })
    )
  }

  function removeImage(id: string) {
    const updated = project.images.filter((img) => img.id !== id)
    let heroIdx = project.heroImageIndex
    const removedIdx = project.images.findIndex((img) => img.id === id)
    if (removedIdx === heroIdx) heroIdx = 0
    else if (removedIdx < heroIdx) heroIdx = heroIdx - 1
    onChange({ images: updated, heroImageIndex: Math.max(0, heroIdx) })
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false)
    void processFiles(e.dataTransfer.files)
  }

  function handleItemDrop(targetIdx: number) {
    if (draggedIdx === null || draggedIdx === targetIdx) return
    const updated = [...project.images]
    const [moved] = updated.splice(draggedIdx, 1)
    updated.splice(targetIdx, 0, moved)
    let heroIdx = project.heroImageIndex
    if (heroIdx === draggedIdx) heroIdx = targetIdx
    else if (draggedIdx < heroIdx && targetIdx >= heroIdx) heroIdx--
    else if (draggedIdx > heroIdx && targetIdx <= heroIdx) heroIdx++
    onChange({ images: updated, heroImageIndex: heroIdx })
    setDraggedIdx(null)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">תמונות ומדיה</h2>

      {/* Drop zone */}
      {project.images.length >= 10 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50 opacity-50 cursor-not-allowed select-none">
          <div className="text-4xl mb-2">🖼️</div>
          <p className="text-gray-500 font-medium">הגעת למקסימום — 10/10 תמונות</p>
          <p className="text-sm text-gray-400 mt-1">הסר תמונה כדי להוסיף חדשה</p>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
          }`}
        >
          <div className="text-4xl mb-2">🖼️</div>
          <p className="text-gray-600 font-medium">גרור תמונות לכאן או לחץ לבחירה</p>
          <p className="text-sm text-gray-400 mt-1">
            JPG, PNG, WebP — עד 10 תמונות
            {project.images.length > 0 && ` (${project.images.length}/10 נבחרו)`}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => { if (e.target.files) void processFiles(e.target.files) }}
          />
        </div>
      )}

      {/* Image grid */}
      {project.images.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {project.images.map((img, idx) => {
            const isUploading = uploadingIds.has(img.id)
            return (
              <div
                key={img.id}
                draggable={!isUploading}
                onDragStart={() => setDraggedIdx(idx)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleItemDrop(idx)}
                className={`relative group rounded-lg overflow-hidden border-2 cursor-grab active:cursor-grabbing ${
                  project.heroImageIndex === idx ? 'border-yellow-400' : 'border-transparent'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.dataUrl} alt={img.name} className="w-full h-28 object-cover" />

                {isUploading && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                    <svg className="animate-spin h-6 w-6 text-blue-600" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  </div>
                )}

                {project.heroImageIndex === idx && !isUploading && (
                  <div className="absolute top-1 right-1 bg-yellow-400 rounded-full w-6 h-6 flex items-center justify-center text-sm">⭐</div>
                )}

                {!isUploading && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => onChange({ heroImageIndex: idx })}
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
                )}
              </div>
            )
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

      {/* Video URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          קישור לסרטון{' '}
          <span className="text-gray-400 font-normal">(YouTube / Vimeo — אופציונלי)</span>
        </label>
        <input
          type="url"
          value={project.videoUrl}
          onChange={(e) => onChange({ videoUrl: e.target.value })}
          placeholder="https://youtube.com/watch?v=..."
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          dir="ltr"
        />
      </div>
    </div>
  )
}
