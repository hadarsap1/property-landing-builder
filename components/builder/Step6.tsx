'use client';

import type { PropertyProject } from '@/types/project';

interface StepProps {
  project: PropertyProject;
  onChange: (partial: Partial<PropertyProject>) => void;
}

interface TemplateConfig {
  id: PropertyProject['template'];
  name: string;
  colors: string[];
}

const TEMPLATES: TemplateConfig[] = [
  {
    id: 'dark-luxury',
    name: 'Dark Luxury',
    colors: ['#0a0e1a', '#c9a96e'],
  },
  {
    id: 'warm-homey',
    name: 'Warm & Homey',
    colors: ['#f5efe6', '#8b5e3c'],
  },
  {
    id: 'modern-blue',
    name: 'Modern Blue',
    colors: ['#1e3a5f', '#4fc3f7'],
  },
  {
    id: 'nature-space',
    name: 'Nature & Space',
    colors: ['#2d5a27', '#a8d5a2'],
  },
  {
    id: 'urban-bold',
    name: 'Urban Bold',
    colors: ['#2c1810', '#e07b39'],
  },
];

export default function Step6({ project, onChange }: StepProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">בחר תבנית עיצוב</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {TEMPLATES.map((t) => {
          const selected = project.template === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange({ template: t.id })}
              className={`rounded-xl border-2 p-4 text-right transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                selected
                  ? 'border-blue-600 shadow-md ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              {/* Color swatches */}
              <div className="flex gap-1.5 mb-3">
                {t.colors.map((color) => (
                  <div
                    key={color}
                    className="h-6 flex-1 rounded"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <p className="text-sm font-medium text-gray-800">{t.name}</p>
              {selected && (
                <p className="text-xs text-blue-600 mt-0.5">✓ נבחר</p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
