'use client';

import { useState } from 'react';
import type { PropertyProject } from '@/types/project';

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
      <h2 className="text-2xl font-bold" style={{ color: '#111' }}>התאמה אישית</h2>

      {/* Accent color */}
      <div>
        <label className="block text-sm font-medium mb-3" style={{ color: '#111' }}>צבע הדגשה</label>
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
              className="w-9 h-9 rounded-full flex items-center justify-center text-lg hover:opacity-70 transition-opacity"
              style={{ border: '2px dashed #aaa', color: '#888' }}
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
          <span className="text-sm font-mono" style={{ color: '#888' }}>{project.accentColor}</span>
        </div>
      </div>

      {/* Font style */}
      <div>
        <label className="block text-sm font-medium mb-3" style={{ color: '#111' }}>סגנון פונט</label>
        <div className="grid grid-cols-3 gap-3">
          {FONT_OPTIONS.map((opt) => {
            const selected = project.fontStyle === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange({ fontStyle: opt.value })}
                className="rounded-lg p-4 text-center transition-all focus:outline-none"
                style={{
                  border: selected ? '2px solid #111' : '2px solid #ddd',
                  background: selected ? '#f7f5f2' : '#fff',
                }}
              >
                <p
                  className={`text-xl mb-1 ${FONT_CLASS[opt.value]}`}
                  style={{ color: project.accentColor }}
                >
                  {opt.sample}
                </p>
                <p className="text-xs" style={{ color: '#888' }}>{opt.label}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Icon picker */}
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: '#111' }}>
          אייקונים של פרטי הנכס
        </label>
        <p className="text-xs mb-3" style={{ color: '#aaa' }}>לחץ על אייקון כדי להחליף אותו</p>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {SPEC_KEY_LABEL.map(({ key, label }) => {
            const current = project.specIcons?.[key] ?? SPEC_ICON_OPTIONS[key]?.[0] ?? '•';
            const isOpen = openIconKey === key;
            return (
              <div key={key} className="relative">
                <button
                  type="button"
                  onClick={() => setOpenIconKey(isOpen ? null : key)}
                  className="w-full flex flex-col items-center gap-1 rounded-lg p-2 transition-all focus:outline-none"
                  style={{
                    border: isOpen ? '2px solid #111' : '2px solid #ddd',
                    background: isOpen ? '#f7f5f2' : '#fff',
                  }}
                >
                  <span className="text-2xl leading-none">{current}</span>
                  <span className="text-xs truncate w-full text-center" style={{ color: '#888' }}>{label}</span>
                </button>

                {isOpen && (
                  <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 z-20 bg-white rounded-lg p-2 flex gap-1.5 flex-wrap w-44" style={{ border: '2px solid #111' }}>
                    {(SPEC_ICON_OPTIONS[key] ?? []).map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => handleIconSelect(key, emoji)}
                        className="text-xl w-9 h-9 rounded flex items-center justify-center transition-all hover:scale-110 focus:outline-none"
                        style={{ background: emoji === current ? '#e5e5e5' : 'transparent' }}
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
        <label className="block text-sm font-medium mb-3" style={{ color: '#111' }}>
          סדר ונראות מקטעים
          <span className="font-normal mr-2 text-xs" style={{ color: '#aaa' }}>גרור לסידור מחדש</span>
        </label>
        <div className="space-y-2">
          {project.sectionOrder.map((sectionId, idx) => (
            <div
              key={sectionId}
              draggable
              onDragStart={() => handleSectionDragStart(sectionId)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleSectionDrop(sectionId)}
              className="flex items-center gap-3 rounded-lg px-4 py-3 md:cursor-grab active:cursor-grabbing transition-colors"
              style={{
                border: draggedSection === sectionId ? '2px solid #111' : '2px solid #ddd',
                background: draggedSection === sectionId ? '#f7f5f2' : '#fff',
              }}
            >
              <span className="select-none hidden md:block" style={{ color: '#ccc' }}>⣿</span>
              <span className="flex-1 text-sm font-medium" style={{ color: '#111' }}>
                {SECTION_LABELS[sectionId] ?? sectionId}
              </span>
              <div className="flex md:hidden gap-1">
                <button
                  type="button"
                  onClick={() => moveSection(idx, idx - 1)}
                  disabled={idx === 0}
                  className="w-7 h-7 rounded flex items-center justify-center text-sm transition-colors disabled:opacity-30 hover:bg-gray-100 focus:outline-none"
                  style={{ border: '1px solid #ddd', color: '#555' }}
                  aria-label="הזז למעלה"
                >↑</button>
                <button
                  type="button"
                  onClick={() => moveSection(idx, idx + 1)}
                  disabled={idx === project.sectionOrder.length - 1}
                  className="w-7 h-7 rounded flex items-center justify-center text-sm transition-colors disabled:opacity-30 hover:bg-gray-100 focus:outline-none"
                  style={{ border: '1px solid #ddd', color: '#555' }}
                  aria-label="הזז למטה"
                >↓</button>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={project.sectionVisibility[sectionId] !== false}
                onClick={() => toggleSection(sectionId)}
                className="relative inline-flex h-5 w-10 items-center rounded-full transition-colors flex-shrink-0"
                style={{ background: project.sectionVisibility[sectionId] !== false ? '#111' : '#ccc' }}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    project.sectionVisibility[sectionId] !== false ? 'translate-x-5' : 'translate-x-1'
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
