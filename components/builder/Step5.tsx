'use client';

import type { PropertyProject } from '@/types/project';

interface StepProps {
  project: PropertyProject;
  onChange: (partial: Partial<PropertyProject>) => void;
}

export default function Step5({ project, onChange }: StepProps) {
  const mapsKey = process.env.NEXT_PUBLIC_MAPS_KEY;
  const mapSrc = mapsKey
    ? `https://www.google.com/maps/embed/v1/place?key=${mapsKey}&q=${encodeURIComponent(project.mapQuery)}`
    : null;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold" style={{ color: 'var(--pb-text)' }}>מיקום</h2>

      {/* Toggle */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium" style={{ color: 'var(--pb-text)' }}>הצג מפה בדף הנכס</span>
        <button
          type="button"
          role="switch"
          dir="ltr"
          aria-checked={project.showMap}
          onClick={() => onChange({ showMap: !project.showMap })}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            project.showMap ? 'bg-blue-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              project.showMap ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {project.showMap && (
        <>
          {/* Manual override */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--pb-text2)' }}>
              כתובת לחיפוש במפה
            </label>
            <input
              type="text"
              value={project.mapQuery}
              onChange={(e) => onChange({ mapQuery: e.target.value })}
              placeholder="הרצל 12, תל אביב, ישראל"
              className="w-full rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ background: 'var(--pb-surface)', border: '1px solid var(--pb-border)', color: 'var(--pb-text)' }}
            />
            <p className="text-xs mt-1" style={{ color: 'var(--pb-text2)' }}>
              מלא אוטומטית מהכתובת שהזנת בשלב 1
            </p>
          </div>

          {/* Map preview */}
          <div className="rounded-xl overflow-hidden h-64" style={{ border: '1px solid var(--pb-border)' }}>
            {mapSrc ? (
              <iframe
                src={mapSrc}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="מפה"
              />
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-center p-4" style={{ background: 'var(--pb-surface2)', color: 'var(--pb-text2)' }}>
                <div>
                  <div className="text-3xl mb-2">🗺️</div>
                  <p>תצוגת המפה תהיה זמינה בגרסה המלאה</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--pb-text2)' }}>המיקום יופיע בדף הסופי</p>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
