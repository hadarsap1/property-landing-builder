'use client';

import type { PropertyProject } from '@/types/project';

interface StepProps {
  project: PropertyProject;
  onChange: (partial: Partial<PropertyProject>) => void;
}

type AirDir = 'N' | 'S' | 'E' | 'W';

const AIR_LABELS: Record<AirDir, string> = {
  N: 'צפון',
  S: 'דרום',
  E: 'מזרח',
  W: 'מערב',
};

const inputStyle: React.CSSProperties = {
  border: '2px solid #111',
  background: '#f7f5f2',
  color: '#111',
};

export default function Step2({ project, onChange }: StepProps) {
  function toggleAir(dir: AirDir) {
    const current = project.airDirections;
    const next = current.includes(dir)
      ? current.filter((d) => d !== dir)
      : [...current, dir];
    onChange({ airDirections: next });
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold" style={{ color: '#111' }}>מפרט הנכס</h2>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: '#111' }}>קומה</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={project.floor ?? ''}
            onChange={(e) => onChange({ floor: e.target.value ? Number(e.target.value) : null })}
            placeholder="3"
            min={0}
            className="w-24 px-3 py-2 rounded-lg text-sm focus:outline-none"
            style={inputStyle}
          />
          <span style={{ color: '#888' }}>מתוך</span>
          <input
            type="number"
            value={project.totalFloors ?? ''}
            onChange={(e) => onChange({ totalFloors: e.target.value ? Number(e.target.value) : null })}
            placeholder="8"
            min={1}
            className="w-24 px-3 py-2 rounded-lg text-sm focus:outline-none"
            style={inputStyle}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: '#111' }}>חניה</label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={project.parkingSpots ?? ''}
            onChange={(e) => onChange({ parkingSpots: e.target.value ? Number(e.target.value) : null })}
            placeholder="1"
            min={0}
            className="w-24 px-3 py-2 rounded-lg text-sm focus:outline-none"
            style={inputStyle}
          />
          <select
            value={project.parkingType}
            onChange={(e) =>
              onChange({ parkingType: e.target.value as PropertyProject['parkingType'] })
            }
            className="px-3 py-2 rounded-lg text-sm focus:outline-none"
            style={inputStyle}
          >
            <option value="">סוג חניה...</option>
            <option value="covered">מקורה</option>
            <option value="outdoor">חיצונית</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#111' }}>תכונות נוספות</label>
        <div className="flex flex-wrap gap-4">
          {[
            { key: 'hasStorage', label: 'מחסן' },
            { key: 'hasSaferoom', label: 'ממ"ד' },
            { key: 'hasElevator', label: 'מעלית' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={project[key as keyof PropertyProject] as boolean}
                onChange={(e) => onChange({ [key]: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <span style={{ color: '#111' }}>{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#111' }}>כיווני אוויר</label>
        <div className="flex gap-3">
          {(Object.keys(AIR_LABELS) as AirDir[]).map((dir) => {
            const active = project.airDirections.includes(dir);
            return (
              <button
                key={dir}
                type="button"
                onClick={() => toggleAir(dir)}
                className="px-4 py-2 rounded-lg border-2 font-medium transition-colors"
                style={{
                  border: '2px solid #111',
                  background: active ? '#111' : '#fff',
                  color: active ? '#f7f5f2' : '#111',
                }}
              >
                {AIR_LABELS[dir]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#111' }}>שנת בנייה</label>
          <input
            type="number"
            value={project.buildYear ?? ''}
            onChange={(e) => onChange({ buildYear: e.target.value ? Number(e.target.value) : null })}
            placeholder="1995"
            min={1900}
            max={2030}
            className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none"
            style={inputStyle}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#111' }}>
            שנת שיפוץ{' '}
            <span className="font-normal" style={{ color: '#888' }}>(אופציונלי)</span>
          </label>
          <input
            type="number"
            value={project.renovationYear ?? ''}
            onChange={(e) =>
              onChange({ renovationYear: e.target.value ? Number(e.target.value) : null })
            }
            placeholder="2018"
            min={1900}
            max={2030}
            className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none"
            style={inputStyle}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: '#111' }}>
          מקלחות/שירותים
        </label>
        <input
          type="number"
          value={project.bathrooms ?? ''}
          onChange={(e) => onChange({ bathrooms: e.target.value ? Number(e.target.value) : null })}
          placeholder="2"
          min={1}
          className="w-32 px-3 py-2 rounded-lg text-sm focus:outline-none"
          style={inputStyle}
        />
      </div>
    </div>
  );
}
