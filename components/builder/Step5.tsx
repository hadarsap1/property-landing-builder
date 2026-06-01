'use client';

import type { PropertyProject } from '@/types/project';

interface StepProps {
  project: PropertyProject;
  onChange: (partial: Partial<PropertyProject>) => void;
}

export default function Step5({ project, onChange }: StepProps) {
  const q = project.mapQuery.trim()
  // Free embed — no API key required
  const mapSrc = q
    ? `https://maps.google.com/maps?q=${encodeURIComponent(q)}&t=m&z=15&output=embed&hl=he`
    : null

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">מיקום</h2>

      {/* Toggle */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">הצג מפה בדף הנכס</span>
        <button
          type="button"
          role="switch"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              כתובת לחיפוש במפה
            </label>
            <input
              type="text"
              value={project.mapQuery}
              onChange={(e) => onChange({ mapQuery: e.target.value })}
              placeholder="הרצל 12, תל אביב, ישראל"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              מלא אוטומטית מהכתובת שהזנת בשלב 1
            </p>
          </div>

          {/* Map preview */}
          <div className="rounded-xl overflow-hidden border border-gray-200 h-64">
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
              <div className="h-full flex items-center justify-center bg-gray-100 text-gray-500 text-sm text-center p-4">
                <div>
                  <div className="text-3xl mb-2">🗺️</div>
                  <p className="font-medium">הזן כתובת להצגת המפה</p>
                  <p className="text-xs text-gray-400 mt-1">תמלא אוטומטית מהכתובת בשלב 1</p>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
