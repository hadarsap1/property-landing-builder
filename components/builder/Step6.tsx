'use client';

import type { PropertyProject } from '@/types/project';

interface StepProps {
  project: PropertyProject;
  onChange: (partial: Partial<PropertyProject>) => void;
}

interface TemplateConfig {
  id: PropertyProject['template'];
  name: string;
  nameHe: string;
  desc: string;
  colors: string[];
}

const TEMPLATES: TemplateConfig[] = [
  {
    id: 'modern-blue',
    name: 'Modern Blue',
    nameHe: 'כחול מודרני',
    desc: 'נקי ומקצועי',
    colors: ['#1e3a5f', '#4fc3f7', '#f0f4f8'],
  },
  {
    id: 'dark-luxury',
    name: 'Dark Luxury',
    nameHe: 'יוקרה כהה',
    desc: 'אלגנטי ופרמיום',
    colors: ['#0a0e1a', '#c9a96e', '#1a1f35'],
  },
  {
    id: 'warm-homey',
    name: 'Warm & Homey',
    nameHe: 'חמים וביתי',
    desc: 'נעים ומזמין',
    colors: ['#8b5e3c', '#f5efe6', '#e8d5c4'],
  },
  {
    id: 'nature-space',
    name: 'Nature & Space',
    nameHe: 'טבע ומרחב',
    desc: 'ירוק ורגוע',
    colors: ['#2d5a27', '#a8d5a2', '#f0f5f0'],
  },
  {
    id: 'urban-bold',
    name: 'Urban Bold',
    nameHe: 'אורבני נועז',
    desc: 'חזק ודינמי',
    colors: ['#2c1810', '#e07b39', '#faf5f0'],
  },
];

export default function Step6({ project, onChange }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold" style={{ color: '#111' }}>בחר תבנית עיצוב</h2>
        <p className="text-sm mt-1" style={{ color: '#888' }}>ניתן לשנות בכל עת — השינוי מופיע בתצוגה המקדימה מיד</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {TEMPLATES.map((t) => {
          const selected = project.template === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange({ template: t.id })}
              className="rounded-lg p-3 text-right transition-all focus:outline-none"
              style={{
                border: selected ? '2px solid #111' : '2px solid #ddd',
                background: selected ? '#f7f5f2' : '#fff',
              }}
            >
              <div className="flex gap-1 mb-3 rounded overflow-hidden h-8">
                {t.colors.map((color, i) => (
                  <div
                    key={color}
                    className="flex-1"
                    style={{ backgroundColor: color, flexGrow: i === 0 ? 2 : 1 }}
                  />
                ))}
              </div>
              <p className="text-sm font-semibold" style={{ color: '#111' }}>{t.nameHe}</p>
              <p className="text-xs mt-0.5" style={{ color: '#888' }}>{t.desc}</p>
              {selected && (
                <p className="text-xs mt-1 font-medium" style={{ color: '#c0392b' }}>✓ נבחר</p>
              )}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-center" style={{ color: '#aaa' }}>
        צבע הדגש וסוג הגופן ניתנים להתאמה בשלב הבא
      </p>
    </div>
  );
}
