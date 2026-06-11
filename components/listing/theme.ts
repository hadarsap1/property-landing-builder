import type { PropertyProject } from '@/types/project';

type TemplateId = PropertyProject['template'];

export interface TemplateTheme {
  heroBg: string;
  heroText: string;
  pageBg: string;
  pageText: string;
  cardBg: string;
  cardBorder: string;
  mutedText: string;
}

export const THEMES: Record<TemplateId, TemplateTheme> = {
  'modern-blue': {
    heroBg: 'linear-gradient(135deg,#1e3a5f 0%,#2d5a8e 100%)',
    heroText: '#ffffff',
    pageBg: '#f0f4f8',
    pageText: '#1e293b',
    cardBg: '#ffffff',
    cardBorder: '#e2e8f0',
    mutedText: '#64748b',
  },
  'dark-luxury': {
    heroBg: 'linear-gradient(135deg,#0a0e1a 0%,#1a1f35 100%)',
    heroText: '#c9a96e',
    pageBg: '#0d1220',
    pageText: '#e8dcc8',
    cardBg: '#161c2e',
    cardBorder: '#2a3048',
    mutedText: '#8a9cc0',
  },
  'warm-homey': {
    heroBg: 'linear-gradient(135deg,#8b5e3c 0%,#6b4530 100%)',
    heroText: '#f5efe6',
    pageBg: '#f5efe6',
    pageText: '#3d2b1f',
    cardBg: '#ffffff',
    cardBorder: '#e8d5c4',
    mutedText: '#8b6f5e',
  },
  'nature-space': {
    heroBg: 'linear-gradient(135deg,#2d5a27 0%,#1a3518 100%)',
    heroText: '#f0f5f0',
    pageBg: '#f0f5f0',
    pageText: '#1a3518',
    cardBg: '#ffffff',
    cardBorder: '#c8e6c4',
    mutedText: '#5a7a56',
  },
  'urban-bold': {
    heroBg: 'linear-gradient(135deg,#2c1810 0%,#4a2c20 100%)',
    heroText: '#ffffff',
    pageBg: '#faf5f0',
    pageText: '#2c1810',
    cardBg: '#ffffff',
    cardBorder: '#e8d8c8',
    mutedText: '#7a5a4a',
  },
};

export const FONT_FAMILY: Record<PropertyProject['fontStyle'], string> = {
  'serif': 'Georgia,"Times New Roman",serif',
  'sans-serif': '"Segoe UI",Arial,sans-serif',
  'display': '"Trebuchet MS","Gill Sans",sans-serif',
};

export const AIR_LABEL: Record<string, string> = { N: 'צפון', S: 'דרום', E: 'מזרח', W: 'מערב' };
export const PARKING_LABEL: Record<string, string> = { covered: 'מקורה', outdoor: 'חיצונית' };

export interface SpecItem { icon: string; label: string; value: string }

export function buildSpecs(p: PropertyProject): SpecItem[] {
  const icons = p.specIcons ?? {};
  const s: SpecItem[] = [];
  if (p.rooms) s.push({ icon: icons.rooms ?? '🏠', label: 'חדרים', value: `${p.rooms}` });
  if (p.builtArea) s.push({ icon: icons.builtArea ?? '📐', label: 'שטח', value: `${p.builtArea} מ״ר` });
  if (p.gardenArea) s.push({ icon: icons.gardenArea ?? '🌿', label: 'גינה/מרפסת', value: `${p.gardenArea} מ״ר` });
  if (p.floor != null) {
    s.push({ icon: icons.floor ?? '🏢', label: 'קומה', value: p.totalFloors ? `${p.floor} מתוך ${p.totalFloors}` : `${p.floor}` });
  }
  if (p.bathrooms) s.push({ icon: icons.bathrooms ?? '🛁', label: 'שירותים', value: `${p.bathrooms}` });
  if (p.parkingSpots) {
    const t = p.parkingType ? PARKING_LABEL[p.parkingType] ?? '' : '';
    s.push({ icon: icons.parking ?? '🚗', label: 'חניה', value: `${p.parkingSpots}${t ? ` ${t}` : ''}` });
  }
  if (p.hasStorage) s.push({ icon: icons.storage ?? '📦', label: 'מחסן', value: '✓' });
  if (p.hasSaferoom) s.push({ icon: icons.saferoom ?? '🛡️', label: 'ממ״ד', value: '✓' });
  if (p.hasElevator) s.push({ icon: icons.elevator ?? '🛗', label: 'מעלית', value: '✓' });
  if (p.buildYear) s.push({ icon: icons.buildYear ?? '📅', label: 'שנת בנייה', value: `${p.buildYear}` });
  if (p.renovationYear) s.push({ icon: icons.renovationYear ?? '🔨', label: 'שיפוץ', value: `${p.renovationYear}` });
  if (p.airDirections?.length) {
    s.push({ icon: icons.airDirections ?? '🧭', label: 'כיוונים', value: p.airDirections.map((d) => AIR_LABEL[d] ?? d).join(', ') });
  }
  return s;
}
