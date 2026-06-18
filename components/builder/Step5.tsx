'use client';

import type { PropertyProject } from '@/types/project';

interface StepProps {
  project: PropertyProject;
  onChange: (partial: Partial<PropertyProject>) => void;
}

export default function Step5({ project, onChange }: StepProps) {
  const q = project.mapQuery.trim()
  const mapSrc = q
    ? `https://maps.google.com/maps?q=${encodeURIComponent(q)}&t=m&z=15&output=embed&hl=he`
    : null

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold" style={{ color: '#111' }}>מיקום</h2>

      {/* Toggle */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium" style={{ color: '#111' }}>הצג מפה בדף הנכס</span>
        <button
          type="button"
          role="switch"
          aria-checked={project.showMap}
          onClick={() => onChange({ showMap: !project.showMap })}
          className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
          style={{ background: project.showMap ? '#111' : '#ccc' }}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              project.showMap ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {project.showMap && (
        <>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#111' }}>
              כתובת לחיפוש במפה
            </label>
            <input
              type="text"
              value={project.mapQuery}
              onChange={(e) => onChange({ mapQuery: e.target.value })}
              placeholder="הרצל 12, תל אביב, ישראל"
              className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none"
              style={{ border: '2px solid #111', background: '#f7f5f2', color: '#111' }}
            />
            <p className="text-xs mt-1" style={{ color: '#888' }}>
              מלא אוטומטית מהכתובת שהזנת בשלב 1
            </p>
          </div>

          <div className="rounded-lg overflow-hidden h-64" style={{ border: '2px solid #111' }}>
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
              <div className="h-full flex items-center justify-center text-sm text-center p-4" style={{ background: '#f7f5f2', color: '#888' }}>
                <div>
                  <div className="text-3xl mb-2">🗺️</div>
                  <p className="font-medium">הזן כתובת להצגת המפה</p>
                  <p className="text-xs mt-1" style={{ color: '#aaa' }}>תמלא אוטומטית מהכתובת בשלב 1</p>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
