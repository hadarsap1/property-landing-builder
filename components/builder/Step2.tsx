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

const inputCls = 'rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500';
const inputStyle = { background: 'var(--pb-surface)', border: '1px solid var(--pb-border)', color: 'var(--pb-text)' };
const labelStyle = { color: 'var(--pb-text2)', fontSize: '0.875rem', fontWeight: 500 };

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
      <h2 className="text-2xl font-bold" style={{ color: 'var(--pb-text)' }}>מפרט הנכס</h2>

      {/* Floor */}
      <div>
        <label className="block mb-1" style={labelStyle}>קומה</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={project.floor ?? ''}
            onChange={(e) => onChange({ floor: e.target.value ? Number(e.target.value) : null })}
            placeholder="3"
            min={0}
            className={`w-24 ${inputCls}`}
            style={inputStyle}
          />
          <span style={{ color: 'var(--pb-text2)' }}>מתוך</span>
          <input
            type="number"
            value={project.totalFloors ?? ''}
            onChange={(e) => onChange({ totalFloors: e.target.value ? Number(e.target.value) : null })}
            placeholder="8"
            min={1}
            className={`w-24 ${inputCls}`}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Parking */}
      <div>
        <label className="block mb-1" style={labelStyle}>חניה</label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={project.parkingSpots ?? ''}
            onChange={(e) => onChange({ parkingSpots: e.target.value ? Number(e.target.value) : null })}
            placeholder="1"
            min={0}
            className={`w-24 ${inputCls}`}
            style={inputStyle}
          />
          <select
            value={project.parkingType}
            onChange={(e) => onChange({ parkingType: e.target.value as PropertyProject['parkingType'] })}
            className={inputCls}
            style={inputStyle}
          >
            <option value="">סוג חניה...</option>
            <option value="covered">מקורה</option>
            <option value="outdoor">חיצונית</option>
          </select>
        </div>
      </div>

      {/* Checkboxes */}
      <div>
        <label className="block mb-2" style={labelStyle}>תכונות נוספות</label>
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
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span style={{ color: 'var(--pb-text)' }}>{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Air Directions */}
      <div>
        <label className="block mb-2" style={labelStyle}>כיווני אוויר</label>
        <div className="flex gap-3">
          {(Object.keys(AIR_LABELS) as AirDir[]).map((dir) => {
            const active = project.airDirections.includes(dir);
            return (
              <button
                key={dir}
                type="button"
                onClick={() => toggleAir(dir)}
                className="px-4 py-2 rounded-lg border-2 font-medium transition-colors"
                style={
                  active
                    ? { borderColor: 'var(--pb-accent)', background: 'var(--pb-accent)', color: '#fff' }
                    : { borderColor: 'var(--pb-border)', background: 'var(--pb-surface2)', color: 'var(--pb-text)' }
                }
              >
                {AIR_LABELS[dir]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Build year + Renovation year */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block mb-1" style={labelStyle}>שנת בנייה</label>
          <input
            type="number"
            value={project.buildYear ?? ''}
            onChange={(e) => onChange({ buildYear: e.target.value ? Number(e.target.value) : null })}
            placeholder="1995"
            min={1900}
            max={2030}
            className={`w-full ${inputCls}`}
            style={inputStyle}
          />
        </div>
        <div>
          <label className="block mb-1" style={labelStyle}>
            שנת שיפוץ{' '}
            <span style={{ color: 'var(--pb-text2)', fontWeight: 400 }}>(אופציונלי)</span>
          </label>
          <input
            type="number"
            value={project.renovationYear ?? ''}
            onChange={(e) => onChange({ renovationYear: e.target.value ? Number(e.target.value) : null })}
            placeholder="2018"
            min={1900}
            max={2030}
            className={`w-full ${inputCls}`}
            style={inputStyle}
          />
        </div>
      </div>

      <div>
        <label className="block mb-1" style={labelStyle}>מקלחות/שירותים</label>
        <input
          type="number"
          value={project.bathrooms ?? ''}
          onChange={(e) => onChange({ bathrooms: e.target.value ? Number(e.target.value) : null })}
          placeholder="2"
          min={1}
          className={`w-32 ${inputCls}`}
          style={inputStyle}
        />
      </div>
    </div>
  );
}
