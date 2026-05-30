'use client';

import { useState } from 'react';
import type { PropertyProject } from '@/types/project';

interface StepProps {
  project: PropertyProject;
  onChange: (partial: Partial<PropertyProject>) => void;
}

function formatIsraeliPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 0) return '';
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

export default function Step8({ project, onChange }: StepProps) {
  // "separate WA" is active when a different whatsapp number is already saved
  const phoneDigits = project.phone.replace(/\D/g, '');
  const waDigits = project.whatsapp.replace(/\D/g, '');
  const [separateWA, setSeparateWA] = useState(
    waDigits.length > 0 && waDigits !== phoneDigits
  );

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatIsraeliPhone(e.target.value);
    onChange({ phone: formatted });
  }

  function toggleSeparateWA(checked: boolean) {
    setSeparateWA(checked);
    if (!checked) {
      // clear the separate WA number — preview will fall back to phone
      onChange({ whatsapp: '' });
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold" style={{ color: 'var(--pb-text)' }}>פרטי יצירת קשר</h2>

      {/* Seller name */}
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--pb-text2)' }}>שם המוכר</label>
        <input
          type="text"
          value={project.sellerName}
          onChange={(e) => onChange({ sellerName: e.target.value })}
          placeholder="ישראל ישראלי"
          className="w-full rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{ background: 'var(--pb-surface)', border: '1px solid var(--pb-border)', color: 'var(--pb-text)' }}
        />
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--pb-text2)' }}>
          טלפון <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          value={project.phone}
          onChange={handlePhoneChange}
          placeholder="050-123-4567"
          dir="ltr"
          className="w-full rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{ background: 'var(--pb-surface)', border: '1px solid var(--pb-border)', color: 'var(--pb-text)' }}
        />
        {!project.phone.trim() ? (
          <p className="text-xs text-amber-500 mt-1">יש להזין טלפון כדי להמשיך</p>
        ) : (
          <p className="text-xs mt-1" style={{ color: 'var(--pb-text2)' }}>כפתור ה-WhatsApp בדף ישתמש באותו מספר</p>
        )}
      </div>

      {/* Optional separate WhatsApp */}
      <div className="space-y-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={separateWA}
            onChange={(e) => toggleSeparateWA(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded"
          />
          <span className="text-sm" style={{ color: 'var(--pb-text)' }}>הוסף מספר WhatsApp שונה</span>
        </label>

        {separateWA && (
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--pb-text2)' }}>
              מספר WhatsApp
            </label>
            <input
              type="tel"
              value={project.whatsapp}
              onChange={(e) => onChange({ whatsapp: formatIsraeliPhone(e.target.value) })}
              placeholder="050-123-4567"
              dir="ltr"
              className="w-full rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ background: 'var(--pb-surface)', border: '1px solid var(--pb-border)', color: 'var(--pb-text)' }}
            />
            <p className="text-xs mt-1" style={{ color: 'var(--pb-text2)' }}>
              כפי שהוזן — הספרות ישלחו ל-WhatsApp אוטומטית
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
