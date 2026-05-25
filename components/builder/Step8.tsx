'use client';

import type { PropertyProject } from '@/types/project';

interface StepProps {
  project: PropertyProject;
  onChange: (partial: Partial<PropertyProject>) => void;
}

function formatIsraeliPhone(raw: string): string {
  // Strip non-digits
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 0) return '';
  // Format as 05X-XXX-XXXX
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

export default function Step8({ project, onChange }: StepProps) {
  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatIsraeliPhone(e.target.value);
    onChange({ phone: formatted });
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">פרטי יצירת קשר</h2>

      {/* Seller name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">שם המוכר</label>
        <input
          type="text"
          value={project.sellerName}
          onChange={(e) => onChange({ sellerName: e.target.value })}
          placeholder="ישראל ישראלי"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">טלפון</label>
        <input
          type="tel"
          value={project.phone}
          onChange={handlePhoneChange}
          placeholder="050-123-4567"
          dir="ltr"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* WhatsApp */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          מספר WhatsApp{' '}
          <span className="text-gray-400 font-normal">(ללא קידומת מדינה)</span>
        </label>
        <input
          type="text"
          value={project.whatsapp}
          onChange={(e) => onChange({ whatsapp: e.target.value.replace(/\D/g, '') })}
          placeholder="0501234567"
          dir="ltr"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-400 mt-1">
          לדוגמה: 0501234567 (ישלח כ‑wa.me/972501234567)
        </p>
      </div>
    </div>
  );
}
