'use client';

import type { PropertyProject } from '@/types/project';

interface StepProps {
  project: PropertyProject;
  onChange: (partial: Partial<PropertyProject>) => void;
}

const ROOM_OPTIONS = [
  1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10,
];

const inputCls = 'w-full rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500';
const inputStyle = {
  background: 'var(--pb-surface)',
  border: '1px solid var(--pb-border)',
  color: 'var(--pb-text)',
};
const labelStyle = { color: 'var(--pb-text2)', fontSize: '0.875rem', fontWeight: 500 };

export default function Step1({ project, onChange }: StepProps) {
  const isRent = project.listingType === 'rent';

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold" style={{ color: 'var(--pb-text)' }}>פרטי הנכס</h2>

      {/* Listing type */}
      <div>
        <label className="block mb-3" style={labelStyle}>סוג העסקה</label>
        <div className="grid grid-cols-2 gap-3">
          {([
            { value: 'sale', emoji: '🏷️', label: 'למכירה' },
            { value: 'rent', emoji: '🔑', label: 'להשכרה' },
          ] as const).map((opt) => {
            const active = project.listingType === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange({ listingType: opt.value, furniture: '' })}
                className="flex flex-col items-center gap-2 py-5 rounded-2xl border-2 transition-all"
                style={
                  active
                    ? { borderColor: 'var(--pb-accent)', background: 'color-mix(in srgb, var(--pb-accent) 12%, transparent)', color: 'var(--pb-accent)' }
                    : { borderColor: 'var(--pb-border)', background: 'var(--pb-surface2)', color: 'var(--pb-text2)' }
                }
              >
                <span className="text-3xl">{opt.emoji}</span>
                <span className="font-semibold text-sm">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="block mb-1" style={labelStyle}>
          שם/כותרת הנכס <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={project.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder={isRent ? 'לדוגמה: דירת 3 חדרים מרווחת בלב הצפון' : 'לדוגמה: דירת 4 חדרים עם נוף לים'}
          className={inputCls}
          style={inputStyle}
        />
        {!project.title.trim() && (
          <p className="text-xs text-amber-500 mt-1">יש להזין כותרת לנכס כדי להמשיך</p>
        )}
      </div>

      {/* Street */}
      <div>
        <label className="block mb-1" style={labelStyle}>רחוב</label>
        <input
          type="text"
          value={project.street}
          onChange={(e) => onChange({ street: e.target.value })}
          placeholder="לדוגמה: הרצל 12"
          className={inputCls}
          style={inputStyle}
        />
      </div>

      {/* City + Neighborhood */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block mb-1" style={labelStyle}>עיר</label>
          <input
            type="text"
            value={project.city}
            onChange={(e) => onChange({ city: e.target.value })}
            placeholder="תל אביב"
            className={inputCls}
            style={inputStyle}
          />
        </div>
        <div>
          <label className="block mb-1" style={labelStyle}>שכונה</label>
          <input
            type="text"
            value={project.neighborhood}
            onChange={(e) => onChange({ neighborhood: e.target.value })}
            placeholder="פלורנטין"
            className={inputCls}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Price */}
      <div>
        <label className="block mb-2" style={labelStyle}>
          {isRent ? 'מחיר שכירות לחודש' : 'מחיר מכירה'}
        </label>
        <div className="flex items-center gap-3 mb-3">
          <input
            type="checkbox"
            id="priceOnRequest"
            checked={project.priceOnRequest}
            onChange={(e) => onChange({ priceOnRequest: e.target.checked, price: e.target.checked ? null : project.price })}
            className="w-4 h-4 text-blue-600 rounded"
          />
          <label htmlFor="priceOnRequest" className="text-sm" style={{ color: 'var(--pb-text2)' }}>
            לא להציג מחיר בדף
          </label>
        </div>
        {!project.priceOnRequest && (
          <div className="relative">
            <span className="absolute right-3 top-1/2 -translate-y-1/2 font-medium" style={{ color: 'var(--pb-text2)' }}>₪</span>
            <input
              type="number"
              value={project.price ?? ''}
              onChange={(e) => onChange({ price: e.target.value ? Number(e.target.value) : null })}
              placeholder={isRent ? '5,500' : '2,500,000'}
              min={0}
              className="w-full rounded-lg ps-8 pe-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={inputStyle}
            />
            {isRent && (
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--pb-text2)' }}>לחודש</span>
            )}
          </div>
        )}
      </div>

      {/* Furniture — rent only */}
      {isRent && (
        <div>
          <label className="block mb-2" style={labelStyle}>ריהוט</label>
          <div className="grid grid-cols-3 gap-2">
            {([
              { value: 'none', label: 'ללא ריהוט' },
              { value: 'partial', label: 'ריהוט חלקי' },
              { value: 'full', label: 'מרוהטת מלאה' },
            ] as const).map((opt) => {
              const active = project.furniture === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onChange({ furniture: opt.value })}
                  className="py-2.5 px-2 rounded-lg text-sm font-medium transition-all"
                  style={
                    active
                      ? { border: '1px solid var(--pb-accent)', background: 'color-mix(in srgb, var(--pb-accent) 12%, transparent)', color: 'var(--pb-accent)' }
                      : { border: '1px solid var(--pb-border)', background: 'var(--pb-surface2)', color: 'var(--pb-text2)' }
                  }
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Areas */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block mb-1" style={labelStyle}>
            שטח בנוי <span style={{ color: 'var(--pb-text2)', fontWeight: 400 }}>מ״ר</span>
          </label>
          <input
            type="number"
            value={project.builtArea ?? ''}
            onChange={(e) => onChange({ builtArea: e.target.value ? Number(e.target.value) : null })}
            placeholder="90"
            min={0}
            className={inputCls}
            style={inputStyle}
          />
        </div>
        <div>
          <label className="block mb-1" style={labelStyle}>
            גינה/מרפסת{' '}
            <span style={{ color: 'var(--pb-text2)', fontWeight: 400 }}>מ״ר (אופציונלי)</span>
          </label>
          <input
            type="number"
            value={project.gardenArea ?? ''}
            onChange={(e) => onChange({ gardenArea: e.target.value ? Number(e.target.value) : null })}
            placeholder="20"
            min={0}
            className={inputCls}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Rooms */}
      <div>
        <label className="block mb-1" style={labelStyle}>מספר חדרים</label>
        <select
          value={project.rooms ?? ''}
          onChange={(e) => onChange({ rooms: e.target.value ? Number(e.target.value) : null })}
          className={inputCls}
          style={inputStyle}
        >
          <option value="">בחר...</option>
          {ROOM_OPTIONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
