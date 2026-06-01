'use client';

import type { PropertyProject } from '@/types/project';

interface StepProps {
  project: PropertyProject;
  onChange: (partial: Partial<PropertyProject>) => void;
}

const ROOM_OPTIONS = [
  1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10,
];

function Required() {
  return <span className="text-red-400 mr-0.5" title="שדה חובה">*</span>;
}

export default function Step1({ project, onChange }: StepProps) {
  const isRent = project.listingType === 'rent';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">פרטי הנכס</h2>
        <p className="text-xs text-gray-400 mt-1">שדות המסומנים ב-* הם חובה</p>
      </div>

      {/* Listing type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">סוג העסקה</label>
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
                className={`flex flex-col items-center gap-2 py-5 rounded-2xl border-2 transition-all font-semibold text-sm ${
                  active
                    ? 'border-blue-500 bg-blue-50 text-blue-600'
                    : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300'
                }`}
              >
                <span className="text-3xl">{opt.emoji}</span>
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          שם/כותרת הנכס <Required />
        </label>
        <input
          type="text"
          value={project.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder={isRent ? 'לדוגמה: דירת 3 חדרים מרווחת בלב הצפון' : 'לדוגמה: דירת 4 חדרים עם נוף לים'}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {!project.title.trim() && (
          <p className="text-xs text-amber-600 mt-1">יש להזין כותרת לנכס כדי להמשיך</p>
        )}
      </div>

      {/* Street */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">רחוב</label>
        <input
          type="text"
          value={project.street}
          onChange={(e) => onChange({ street: e.target.value })}
          placeholder="לדוגמה: הרצל 12"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* City + Neighborhood */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            עיר<Required />
          </label>
          <input
            type="text"
            value={project.city}
            onChange={(e) => onChange({ city: e.target.value })}
            placeholder="תל אביב"
            className={`w-full border rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              !project.city.trim() ? 'border-orange-300 bg-orange-50/40' : 'border-gray-300'
            }`}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">שכונה</label>
          <input
            type="text"
            value={project.neighborhood}
            onChange={(e) => onChange({ neighborhood: e.target.value })}
            placeholder="פלורנטין"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Price */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
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
          <label htmlFor="priceOnRequest" className="text-sm text-gray-700">
            לא להציג מחיר בדף
          </label>
        </div>
        {!project.priceOnRequest && (
          <div className="relative">
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₪</span>
            <input
              type="number"
              value={project.price ?? ''}
              onChange={(e) => onChange({ price: e.target.value ? Number(e.target.value) : null })}
              placeholder={isRent ? '5,500' : '2,500,000'}
              min={0}
              className={`w-full border rounded-lg pr-8 pl-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                !project.priceOnRequest && !project.price ? 'border-orange-300 bg-orange-50/40' : 'border-gray-300'
              }`}
            />
            {isRent && (
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">לחודש</span>
            )}
          </div>
        )}
        {!project.priceOnRequest && !project.price && (
          <p className="text-xs text-orange-500 mt-1">הזן מחיר או סמן "לא להציג מחיר בדף"</p>
        )}
      </div>

      {/* Furniture — rent only */}
      {isRent && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">ריהוט</label>
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
                  className={`py-2.5 px-2 rounded-lg text-sm font-medium transition-all border ${
                    active
                      ? 'border-blue-500 bg-blue-50 text-blue-600'
                      : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                  }`}
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            שטח בנוי <span className="text-gray-400 font-normal">מ״ר</span>
          </label>
          <input
            type="number"
            value={project.builtArea ?? ''}
            onChange={(e) => onChange({ builtArea: e.target.value ? Number(e.target.value) : null })}
            placeholder="90"
            min={0}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            גינה/מרפסת{' '}
            <span className="text-gray-400 font-normal">מ״ר</span>
          </label>
          <input
            type="number"
            value={project.gardenArea ?? ''}
            onChange={(e) => onChange({ gardenArea: e.target.value ? Number(e.target.value) : null })}
            placeholder="20"
            min={0}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Rooms */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">מספר חדרים</label>
        <select
          value={project.rooms ?? ''}
          onChange={(e) => onChange({ rooms: e.target.value ? Number(e.target.value) : null })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">בחר...</option>
          {ROOM_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {r} חדרים
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
