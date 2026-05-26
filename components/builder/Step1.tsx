'use client';

import type { PropertyProject } from '@/types/project';

interface StepProps {
  project: PropertyProject;
  onChange: (partial: Partial<PropertyProject>) => void;
}

const ROOM_OPTIONS = [
  1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10,
];

export default function Step1({ project, onChange }: StepProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">פרטי הנכס</h2>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          שם/כותרת הנכס
        </label>
        <input
          type="text"
          value={project.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="לדוגמה: דירת 4 חדרים עם נוף לים"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
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
          <label className="block text-sm font-medium text-gray-700 mb-1">עיר</label>
          <input
            type="text"
            value={project.city}
            onChange={(e) => onChange({ city: e.target.value })}
            placeholder="תל אביב"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <label className="block text-sm font-medium text-gray-700 mb-2">מחיר</label>
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
              placeholder="2,500,000"
              min={0}
              className="w-full border border-gray-300 rounded-lg pr-8 pl-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </div>

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
            <span className="text-gray-400 font-normal">מ״ר (אופציונלי)</span>
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
              {r}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
