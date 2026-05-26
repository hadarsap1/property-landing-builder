'use client';

import { useState } from 'react';
import type { PropertyProject } from '@/types/project';

// ── Icon picker data ──────────────────────────────────────────────────────────

const SPEC_ICON_OPTIONS: Record<string, string[]> = {
  rooms:         ['🏠', '🛏️', '🏡', '🚪', '🏘️', '🛋️'],
  builtArea:     ['📐', '📏', '🏗️', '🏢', '⬜', '📊'],
  gardenArea:    ['🌿', '🌳', '🌱', '🪴', '🌻', '🍃'],
  floor:         ['🏢', '🏗️', '⬆️', '🔼', '📶', '🪜'],
  bathrooms:     ['🛁', '🚿', '🪥', '🧼', '💧', '🚽'],
  parking:       ['🚗', '🅿️', '🏎️', '🚙', '🔑', '🚘'],
  storage:       ['📦', '🗄️', '📫', '🏠', '📋', '🧰'],
  saferoom:      ['🛡️', '🔒', '🔐', '⚠️', '🏠', '🪖'],
  elevator:      ['🛗', '⬆️', '🔼', '⬇️', '🏢', '♿'],
  buildYear:     ['📅', '🗓️', '📆', '🏗️', '🔢', '📌'],
  renovationYear:['🔨', '🛠️', '✨', '🔧', '🏗️', '🪛'],
  airDirections: ['🧭', '🌬️', '⬆️', '🌅', '🗺️', '🌀'],
};

const SPEC_KEY_LABEL: { key: string; label: string }[] = [
  { key: 'rooms',          label: 'חדרים' },
  { key: 'builtArea',      label: 'שטח' },
  { key: 'gardenArea',     label: 'גינה/מרפסת' },
  { key: 'floor',          label: 'קומה' },
  { key: 'bathrooms',      label: 'שירותים' },
  { key: 'parking',        label: 'חניה' },
  { key: 'storage',        label: 'מחסן' },
  { key: 'saferoom',       label: 'ממ״ד' },
  { key: 'elevator',       label: 'מעלית' },
  { key: 'buildYear',      label: 'שנת בנייה' },
  { key: 'renovationYear', label: 'שיפוץ' },
  { key: 'airDirections',  label: 'כיוונים' },
];

interface StepProps {
  project: PropertyProject;
  onChange: (partial: Partial<PropertyProject>) => void;
}

const PRESET_COLORS = ['#2563eb', '#dc2626', '#16a34a', '#d97706', '#7c3aed'];

const FONT_OPTIONS: { value: PropertyProject['fontStyle']; label: string; sample: string }[] = [
  { value: 'serif', label: 'Serif', sample: 'בית חלומות' },
  { value: 'sans-serif', label: 'Sans-serif', sample: 'בית חלומות' },
  { value: 'display', label: 'Display', sample: 'בית חלומות' },
];

const FONT_CLASS: Record<PropertyProject['fontStyle'], string> = {
  serif: 'font-serif',
  'sans-serif': 'font-sans',
  display: 'font-mono',
};

const SECTION_LABELS: Record<string, string> = {
  hero: 'תמונה ראשית',
  story: 'הסיפור',
  specs: 'מפרט',
  gallery: 'גלריה',
  map: 'מיקום',
  contact: 'יצירת קשר',
};

export default function Step7({ project, onChange }: StepProps) {
  const [draggedSection, setDraggedSection] = useState<string | null>(null);
  const [openIconKey, setOpenIconKey] = useState<string | null>(null);

  function handleIconSelect(key: string, emoji: string) {
    onChange({ specIcons: { ...project.specIcons, [key]: emoji } });
    setOpenIconKey(null);
  }

  function handleSectionDragStart(id: string) {
    setDraggedSection(id);
  }

  function handleSectionDrop(targetId: string) {
    if (!draggedSection || draggedSection === targetId) return;
    const updated = [...project.sectionOrder];
    const fromIdx = updated.indexOf(draggedSection);
    const toIdx = updated.indexOf(targetId);
    if (fromIdx === -1 || toIdx === -1) return;
    updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, draggedSection);
    onChange({ sectionOrder: updated });
    setDraggedSection(null);
  }

  function moveSection(fromIdx: number, toIdx: number) {
    if (toIdx < 0 || toIdx >= project.sectionOrder.length) return;
    const updated = [...project.sectionOrder];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);
    onChange({ sectionOrder: updated });
  }

  function toggleSection(id: string) {
    onChange({
      sectionVisibility: {
        ...project.sectionVisibility,
        [id]: !project.sectionVisibility[id],
      },
    });
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-800">התאמה אישית</h2>

      {/* Accent color */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">צבע הדגשה</label>
        <div className="flex items-center gap-3 flex-wrap">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => onChange({ accentColor: color })}
              className={`w-9 h-9 rounded-full transition-all focus:outline-none ${
                project.accentColor === color
                  ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                  : 'hover:scale-105'
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
          <label className="cursor-pointer">
            <div
              className="w-9 h-9 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-lg hover:border-gray-400 transition-colors"
              title="צבע מותאם אישית"
            >
              +
            </div>
            <input
              type="color"
              value={project.accentColor}
              onChange={(e) => onChange({ accentColor: e.target.value })}
              className="sr-only"
            />
          </label>
          <span className="text-sm text-gray-500 font-mono">{project.accentColor}</span>
        </div>
      </div>

      {/* Font style */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">סגנון פונט</label>
        <div className="grid grid-cols-3 gap-3">
          {FONT_OPTIONS.map((opt) => {
            const selected = project.fontStyle === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange({ fontStyle: opt.value })}
                className={`rounded-xl border-2 p-4 text-center transition-all focus:outline-none ${
                  selected
                    ? 'border-blue-600 bg-blue-50 shadow-sm'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <p
                  className={`text-xl mb-1 ${FONT_CLASS[opt.value]}`}
                  style={{ color: project.accentColor }}
                >
                  {opt.sample}
                </p>
                <p className="text-xs text-gray-500">{opt.label}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Icon picker for spec items */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          אייקונים של פרטי הנכס
        </label>
        <p className="text-xs text-gray-400 mb-3">לחץ על אייקון כדי להחליף אותו</p>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {SPEC_KEY_LABEL.map(({ key, label }) => {
            const current = project.specIcons?.[key] ?? SPEC_ICON_OPTIONS[key]?.[0] ?? '•';
            const isOpen = openIconKey === key;
            return (
              <div key={key} className="relative">
                <button
                  type="button"
                  onClick={() => setOpenIconKey(isOpen ? null : key)}
                  className={`w-full flex flex-col items-center gap-1 border rounded-xl p-2 transition-all focus:outline-none ${
                    isOpen
                      ? 'border-blue-400 bg-blue-50 shadow-sm'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-2xl leading-none">{current}</span>
                  <span className="text-xs text-gray-500 truncate w-full text-center">{label}</span>
                </button>

                {/* Emoji options popover */}
                {isOpen && (
                  <div className="absolute bottom-full mb-1 right-0 z-20 bg-white border border-gray-200 rounded-xl shadow-lg p-2 flex gap-1.5 flex-wrap w-44">
                    {(SPEC_ICON_OPTIONS[key] ?? []).map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => handleIconSelect(key, emoji)}
                        className={`text-xl w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:scale-110 focus:outline-none ${
                          emoji === current ? 'bg-blue-100 ring-2 ring-blue-400' : 'hover:bg-gray-100'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Section order */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          סדר ונראות מקטעים
          <span className="text-gray-400 font-normal mr-2 text-xs">גרור לסידור מחדש</span>
        </label>
        <div className="space-y-2">
          {project.sectionOrder.map((sectionId, idx) => (
            <div
              key={sectionId}
              draggable
              onDragStart={() => handleSectionDragStart(sectionId)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleSectionDrop(sectionId)}
              className={`flex items-center gap-3 bg-white border rounded-lg px-4 py-3 md:cursor-grab active:cursor-grabbing transition-colors ${
                draggedSection === sectionId
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Drag handle — desktop only */}
              <span className="text-gray-300 select-none hidden md:block">⣿</span>
              <span className="flex-1 text-gray-700 text-sm font-medium">
                {SECTION_LABELS[sectionId] ?? sectionId}
              </span>
              {/* Mobile: ↑↓ reorder buttons */}
              <div className="flex md:hidden gap-1">
                <button
                  type="button"
                  onClick={() => moveSection(idx, idx - 1)}
                  disabled={idx === 0}
                  className="w-7 h-7 rounded border border-gray-200 flex items-center justify-center text-gray-500 disabled:opacity-30 hover:bg-gray-100 transition-colors text-sm"
                  aria-label="הזז למעלה"
                >↑</button>
                <button
                  type="button"
                  onClick={() => moveSection(idx, idx + 1)}
                  disabled={idx === project.sectionOrder.length - 1}
                  className="w-7 h-7 rounded border border-gray-200 flex items-center justify-center text-gray-500 disabled:opacity-30 hover:bg-gray-100 transition-colors text-sm"
                  aria-label="הזז למטה"
                >↓</button>
              </div>
              {/* Visibility toggle */}
              <button
                type="button"
                role="switch"
                aria-checked={project.sectionVisibility[sectionId] !== false}
                onClick={() => toggleSection(sectionId)}
                className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors flex-shrink-0 ${
                  project.sectionVisibility[sectionId] !== false ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                    project.sectionVisibility[sectionId] !== false
                      ? 'translate-x-5'
                      : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
