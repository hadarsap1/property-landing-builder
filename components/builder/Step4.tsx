'use client'

import { useEffect, useRef, useState } from 'react'
import type { PropertyProject, StoredImage } from '@/types/project'

interface StepProps {
  project: PropertyProject
  onChange: (partial: Partial<PropertyProject>) => void
  /** Lets an anonymous builder upload photos against its own listing. */
  listingId?: string | null
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

/**
 * Only an https URL from Blob storage actually survives a save — the database
 * and the listings API both reject anything else, since a `blob:`/`data:` URL
 * dies with the tab and would render as a broken image on the published page.
 */
export function isStoredUrl(url: string | undefined): boolean {
  return typeof url === 'string' && url.startsWith('https://')
}

type UploadOutcome = { url: string; error?: string }

/** Why an upload failed, in the user's language and specific enough to act on. */
function uploadErrorFor(status: number): string {
  if (status === 401) return 'צריך להתחבר כדי לשמור תמונות'
  if (status === 413) return 'הקובץ גדול מדי (עד 5MB)'
  if (status === 415) return 'סוג קובץ לא נתמך'
  if (status === 429) return 'הגעת למגבלה היומית להעלאת תמונות'
  if (status === 503) return 'שירות התמונות אינו זמין כרגע'
  return 'ההעלאה נכשלה'
}

/**
 * Uploads to Blob storage. On failure the caller still gets a local preview
 * URL so the wizard keeps working, but `error` is set — the image must then be
 * reported as unsaved rather than silently dropped at save time.
 *
 * Signed-in users go through /api/blob/upload so the upload counts against
 * their own quota. That route 401s for anonymous builders, who fall back to
 * the listing-scoped anonymous route so they can add photos before
 * registering.
 */
async function uploadImage(file: File, listingId?: string | null): Promise<UploadOutcome> {
  try {
    const blob = await resizeToBlob(file)
    const named = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })

    const post = async (url: string) => {
      const fd = new FormData()
      fd.append('file', named)
      return fetch(url, { method: 'POST', body: fd })
    }

    let res = await post('/api/blob/upload')
    if (res.status === 401 && listingId) {
      res = await post(`/api/blob/upload-anon?listingId=${encodeURIComponent(listingId)}`)
    }
    if (res.ok) {
      const { url } = (await res.json()) as { url: string }
      return { url }
    }
    return { url: await resizeToDataUrl(file), error: uploadErrorFor(res.status) }
  } catch {
    return { url: await resizeToDataUrl(file), error: 'ההעלאה נכשלה — בדקו את החיבור' }
  }
}

const GALLERY_OPTIONS: { value: PropertyProject['galleryType']; label: string }[] = [
  { value: 'grid', label: 'גלריה' },
  { value: 'manual-carousel', label: 'קרוסלה ידנית' },
  { value: 'auto-3s', label: 'קרוסלה אוטומטית (3 שניות)' },
  { value: 'auto-5s', label: 'קרוסלה אוטומטית (5 שניות)' },
  { value: 'auto-7s', label: 'קרוסלה אוטומטית (7 שניות)' },
]

const PHOTO_TIPS = [
  { icon: '☀️', tip: 'צלם ביום עם אור טבעי — פתח וילונות וסגור תאורה מלאכותית' },
  { icon: '📐', tip: 'הכנס את כל החדר בפריים — עמוד בפינה ותצלם לכיוון האלכסון' },
  { icon: '🧹', tip: 'פנה וסדר לפני צילום — הוצא פריטים אישיים ועודפי ריהוט' },
  { icon: '✨', tip: 'לחץ על "שפר" על כל תמונה לשדרוג בהירות ורוויה אוטומטי' },
  { icon: '⭐', tip: 'בחר כתמונה ראשית את הנוף/חדר הכי מרשים — היא תמשוך קוראים' },
]

function FloorPlanUploader({ project, onChange, listingId }: StepProps) {
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function processFile(file: File) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return
    setUploading(true)
    setUploadError(null)
    try {
      const { url, error } = await uploadImage(file, listingId)
      const floorPlan: StoredImage = {
        id: `fp-${Date.now()}`,
        dataUrl: url,
        name: file.name,
      }
      onChange({ floorPlan })
      // Same rule as the gallery: a local preview is shown, but it will not
      // survive a save, so say so instead of letting it look stored.
      if (error) setUploadError(error)
    } finally {
      setUploading(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) void processFile(file)
  }

  if (project.floorPlan) {
    return (
      <div className="relative rounded-lg overflow-hidden border-2 border-dashed" style={{ borderColor: '#aaa' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={project.floorPlan.dataUrl}
          alt="תוכנית דירה"
          className="w-full max-h-64 object-contain bg-white"
        />
        <button
          type="button"
          onClick={() => onChange({ floorPlan: null })}
          className="absolute top-2 left-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm leading-none"
          aria-label="הסר תוכנית דירה"
        >
          ✕
        </button>
        {!isStoredUrl(project.floorPlan.dataUrl) && (
          <div
            className="absolute inset-x-0 bottom-0 px-3 py-2 text-xs font-bold text-white"
            style={{ background: '#c0392b' }}
            role="alert"
          >
            לא נשמרה{uploadError ? ` — ${uploadError}` : ''}. התוכנית לא תופיע בדף הנכס.
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => !uploading && fileInputRef.current?.click()}
      className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors"
      style={{ borderColor: dragOver ? '#111' : '#aaa', background: dragOver ? '#f0eeeb' : '#f7f5f2' }}
    >
      {uploading ? (
        <div className="flex items-center justify-center gap-2 text-sm" style={{ color: '#888' }}>
          <svg className="animate-spin h-5 w-5" style={{ color: '#c0392b' }} viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          מעלה...
        </div>
      ) : (
        <>
          <div className="text-3xl mb-1">📐</div>
          <p className="text-sm font-medium" style={{ color: '#111' }}>גרור תוכנית דירה או לחץ לבחירה</p>
          <p className="text-xs mt-0.5" style={{ color: '#888' }}>JPG, PNG, WebP — תמונה אחת</p>
        </>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => { if (e.target.files?.[0]) void processFile(e.target.files[0]) }}
      />
    </div>
  )
}

export default function Step4({ project, onChange, listingId }: StepProps) {
  const [tipsOpen, setTipsOpen] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null)
  const [uploadingIds, setUploadingIds] = useState<Set<string>>(new Set())
  const [enhancing, setEnhancing] = useState<Record<string, boolean>>({})
  // Images whose upload failed, id -> reason. These render fine in the wizard
  // but would vanish on save, so they are called out rather than left to look
  // saved. Originals are kept so the user can retry without re-picking files.
  const [failedUploads, setFailedUploads] = useState<Record<string, string>>({})
  const originalFilesRef = useRef<Map<string, File>>(new Map())
  const fileInputRef = useRef<HTMLInputElement>(null)
  // Tracks the latest images array so parallel uploads don't clobber each other.
  // Synced in an effect (not during render) so concurrent renders stay pure.
  const latestImagesRef = useRef<StoredImage[]>(project.images)
  useEffect(() => {
    latestImagesRef.current = project.images
  }, [project.images])

  function applyEnhancement(dataUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const image = new Image()
      image.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = image.width
        canvas.height = image.height
        const ctx = canvas.getContext('2d')
        if (!ctx) { reject(new Error('canvas unavailable')); return }
        ctx.filter = 'brightness(1.12) contrast(1.08) saturate(1.22)'
        ctx.drawImage(image, 0, 0)
        resolve(canvas.toDataURL('image/jpeg', 0.9))
      }
      image.onerror = () => reject(new Error('image load failed'))
      image.src = dataUrl
    })
  }

  async function enhanceImage(img: StoredImage) {
    setEnhancing((prev) => ({ ...prev, [img.id]: true }))
    try {
      const enhancedDataUrl = await applyEnhancement(img.dataUrl)
      const updated = latestImagesRef.current.map((i) =>
        i.id === img.id ? { ...i, enhancedDataUrl } : i
      )
      onChange({ images: updated })
    } catch {
      // silently ignore
    } finally {
      setEnhancing((prev) => ({ ...prev, [img.id]: false }))
    }
  }

  function revertEnhancement(imgId: string) {
    const updated = latestImagesRef.current.map((i) =>
      i.id === imgId ? { ...i, enhancedDataUrl: undefined } : i
    )
    onChange({ images: updated })
  }

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
          const { url, error } = await uploadImage(file, listingId)
          const updated = latestImagesRef.current.map((img) =>
            img.id === id ? { ...img, dataUrl: url } : img
          )
          latestImagesRef.current = updated
          onChange({ images: updated })
          if (error) {
            originalFilesRef.current.set(id, file)
            setFailedUploads((prev) => ({ ...prev, [id]: error }))
          }
        } finally {
          setUploadingIds((prev) => { const s = new Set(prev); s.delete(id); return s })
        }
      })
    )
  }

  /** Re-attempt a failed upload with the file the user already picked. */
  async function retryUpload(id: string) {
    const file = originalFilesRef.current.get(id)
    if (!file) return
    setUploadingIds((prev) => new Set([...prev, id]))
    try {
      const { url, error } = await uploadImage(file, listingId)
      const updated = latestImagesRef.current.map((img) =>
        img.id === id ? { ...img, dataUrl: url } : img
      )
      latestImagesRef.current = updated
      onChange({ images: updated })
      setFailedUploads((prev) => {
        const next = { ...prev }
        if (error) next[id] = error
        else { delete next[id]; originalFilesRef.current.delete(id) }
        return next
      })
    } finally {
      setUploadingIds((prev) => { const s = new Set(prev); s.delete(id); return s })
    }
  }

  // An image counts as unsaved whenever its URL isn't a stored one — this also
  // catches uploads that never resolved, not just ones that reported an error.
  const unsavedImages = project.images.filter(
    (img) => !uploadingIds.has(img.id) && !isStoredUrl(img.dataUrl)
  )

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
      <h2 className="text-2xl font-bold" style={{ color: '#111' }}>תמונות ומדיה</h2>

      <div className="rounded-lg overflow-hidden" style={{ border: '1px solid #ddd' }}>
        <button
          type="button"
          onClick={() => setTipsOpen((p) => !p)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold"
          style={{ background: '#f7f5f2', color: '#111' }}
        >
          <span>💡 טיפים לצילום נכס מקצועי</span>
          <span className={`transition-transform ${tipsOpen ? 'rotate-180' : ''}`} style={{ color: '#888' }}>▼</span>
        </button>
        {tipsOpen && (
          <ul className="px-4 pb-4 space-y-2.5" style={{ background: '#fff' }}>
            {PHOTO_TIPS.map((t, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: '#555' }}>
                <span className="mt-0.5 shrink-0">{t.icon}</span>
                <span>{t.tip}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Drop zone */}
      {project.images.length >= 10 ? (
        <div className="border-2 border-dashed rounded-lg p-8 text-center opacity-50 cursor-not-allowed select-none" style={{ borderColor: '#ddd', background: '#f7f5f2' }}>
          <div className="text-4xl mb-2">🖼️</div>
          <p className="font-medium" style={{ color: '#888' }}>הגעת למקסימום — 10/10 תמונות</p>
          <p className="text-sm mt-1" style={{ color: '#aaa' }}>הסר תמונה כדי להוסיף חדשה</p>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors"
          style={{ borderColor: dragOver ? '#111' : '#aaa', background: dragOver ? '#f0eeeb' : '#f7f5f2' }}
        >
          <div className="text-4xl mb-2">🖼️</div>
          <p className="font-medium" style={{ color: '#111' }}>גרור תמונות לכאן או לחץ לבחירה</p>
          <p className="text-sm mt-1" style={{ color: '#888' }}>
            JPG, PNG, WebP | עד 10 תמונות
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

      {/* Unsaved-image warning. Without this the wizard shows the photo, reports
          "נשמר", and drops it at save time — the user only finds out when the
          published page comes up empty. */}
      {unsavedImages.length > 0 && (
        <div
          className="rounded-lg p-4 text-sm"
          style={{ background: '#fef2f2', border: '2px solid #c0392b', color: '#7f1d1d' }}
          role="alert"
        >
          <div className="font-bold mb-1">
            {unsavedImages.length === 1
              ? 'תמונה אחת לא נשמרה'
              : `${unsavedImages.length} תמונות לא נשמרו`}
          </div>
          <p className="mb-2">
            {failedUploads[unsavedImages[0].id] ?? 'ההעלאה נכשלה'} — התמונות מוצגות כאן אך לא יופיעו בדף הנכס.
          </p>
          <button
            type="button"
            onClick={() => unsavedImages.forEach((img) => void retryUpload(img.id))}
            className="text-xs font-bold px-3 py-1.5 rounded-lg text-white transition-opacity hover:opacity-85"
            style={{ background: '#c0392b' }}
          >
            נסה להעלות שוב
          </button>
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
                <img src={img.enhancedDataUrl ?? img.dataUrl} alt={img.name} className="w-full h-28 object-cover" />

                {/* Unsaved badge — takes precedence over the enhanced badge */}
                {!isUploading && !isStoredUrl(img.dataUrl) && (
                  <div className="absolute top-1 left-1 bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full leading-none pointer-events-none">
                    לא נשמרה
                  </div>
                )}

                {/* Enhanced badge */}
                {img.enhancedDataUrl && !isUploading && isStoredUrl(img.dataUrl) && (
                  <div className="absolute top-1 left-1 bg-purple-500 text-white text-[10px] px-1.5 py-0.5 rounded-full leading-none pointer-events-none">
                    ✨ שופר
                  </div>
                )}

                {isUploading && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                    <svg className="animate-spin h-6 w-6" style={{ color: '#c0392b' }} viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  </div>
                )}

                {/* Hero star — always visible when not uploading */}
                {project.heroImageIndex === idx && !isUploading && (
                  <div className="absolute top-1 right-1 bg-yellow-400 rounded-full w-5 h-5 flex items-center justify-center text-xs pointer-events-none">⭐</div>
                )}

                {!isUploading && (
                  <>
                    {/* Desktop: hover overlay (drag-and-drop available) */}
                    <div className="absolute inset-0 bg-black/40 hidden md:flex opacity-0 group-hover:opacity-100 transition-opacity items-center justify-center gap-1.5 flex-wrap p-1">
                      <button
                        type="button"
                        onClick={() => onChange({ heroImageIndex: idx })}
                        title="הגדר כתמונה ראשית"
                        className="bg-yellow-400 text-xs text-white px-2 py-1 rounded"
                      >
                        ⭐ ראשי
                      </button>
                      {!img.enhancedDataUrl ? (
                        <button
                          type="button"
                          onClick={() => void enhanceImage(img)}
                          disabled={enhancing[img.id]}
                          title="שפר את התמונה"
                          className="bg-purple-500 text-xs text-white px-2 py-1 rounded disabled:opacity-60"
                        >
                          {enhancing[img.id] ? '...' : '✨ שופר'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => revertEnhancement(img.id)}
                          title="בטל שיפור"
                          className="bg-gray-500 text-xs text-white px-2 py-1 rounded"
                        >
                          ↩ בטל
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(img.id)}
                        className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm leading-none"
                      >
                        ✕
                      </button>
                    </div>
                    {/* Mobile: always-visible bottom controls */}
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
                          onClick={() => removeImage(img.id)}
                          className="w-6 h-6 rounded bg-red-500/90 text-white flex items-center justify-center text-xs leading-none"
                          aria-label="מחק תמונה"
                        >✕</button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Min-image warning */}
      {project.images.length === 0 && (
        <div className="flex items-start gap-3 rounded-lg px-4 py-3 text-sm" style={{ background: '#f7f5f2', border: '1px solid #ddd', color: '#555' }}>
          <span className="text-lg leading-none mt-0.5">📷</span>
          <p>
            <span className="font-semibold">לא הועלו תמונות.</span>
            {' '}דפי נחיתה עם תמונות מקבלים פי 3 יותר פניות — מומלץ להוסיף לפחות 3 תמונות.
          </p>
        </div>
      )}
      {project.images.length > 0 && project.images.length < 3 && (
        <div className="flex items-start gap-3 rounded-lg px-4 py-3 text-sm" style={{ background: '#f7f5f2', border: '1px solid #ddd', color: '#555' }}>
          <span className="text-lg leading-none mt-0.5">💡</span>
          <p>יש לך {project.images.length} תמונה. הוספת לפחות 3 תמונות משפרת משמעותית את שיעור הפניות.</p>
        </div>
      )}

      {/* Gallery type */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#111' }}>סוג גלריה</label>
        <div className="space-y-2">
          {GALLERY_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="galleryType"
                value={opt.value}
                checked={project.galleryType === opt.value}
                onChange={() => onChange({ galleryType: opt.value })}
              />
              <span style={{ color: '#111' }}>{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Floor Plan */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#111' }}>
          תוכנית דירה <span className="font-normal" style={{ color: '#888' }}>(אופציונלי)</span>
        </label>
        <FloorPlanUploader project={project} onChange={onChange} listingId={listingId} />
      </div>

      {/* Video URL */}
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: '#111' }}>
          קישור לסרטון{' '}
          <span className="font-normal" style={{ color: '#888' }}>(YouTube / Vimeo — אופציונלי)</span>
        </label>
        <input
          type="url"
          value={project.videoUrl}
          onChange={(e) => onChange({ videoUrl: e.target.value })}
          placeholder="https://youtube.com/watch?v=..."
          className="w-full px-4 py-2.5 text-sm focus:outline-none rounded-lg"
          style={{ border: '2px solid #111', background: '#f7f5f2', color: '#111' }}
          dir="ltr"
        />
      </div>
    </div>
  )
}
