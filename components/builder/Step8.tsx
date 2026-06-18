'use client';

import { useState } from 'react';
import type { PropertyProject } from '@/types/project';

interface StepProps {
  project: PropertyProject;
  onChange: (partial: Partial<PropertyProject>) => void;
}

function isoToLocalInput(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function localInputToIso(value: string): string {
  if (!value) return '';
  const d = new Date(value);
  return isNaN(d.getTime()) ? '' : d.toISOString();
}

function formatIsraeliPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 0) return '';
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

const inputStyle: React.CSSProperties = {
  border: '2px solid #111',
  background: '#f7f5f2',
  color: '#111',
};

export default function Step8({ project, onChange }: StepProps) {
  const phoneDigits = project.phone.replace(/\D/g, '');
  const waDigits = project.whatsapp.replace(/\D/g, '');
  const [separateWA, setSeparateWA] = useState(
    waDigits.length > 0 && waDigits !== phoneDigits
  );
  const [openHouseOn, setOpenHouseOn] = useState(!!project.openHouseDate);

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatIsraeliPhone(e.target.value);
    onChange({ phone: formatted });
  }

  function toggleSeparateWA(checked: boolean) {
    setSeparateWA(checked);
    if (!checked) onChange({ whatsapp: '' });
  }

  function toggleOpenHouse(checked: boolean) {
    setOpenHouseOn(checked);
    if (!checked) onChange({ openHouseDate: '', openHouseEnd: '' });
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold" style={{ color: '#111' }}>פרטי יצירת קשר</h2>

      <div>
        <label htmlFor="seller-name" className="block text-sm font-medium mb-1" style={{ color: '#111' }}>שם המוכר</label>
        <input
          id="seller-name"
          type="text"
          value={project.sellerName}
          onChange={(e) => onChange({ sellerName: e.target.value })}
          placeholder="ישראל ישראלי"
          className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none"
          style={inputStyle}
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium mb-1" style={{ color: '#111' }}>
          טלפון <span style={{ color: '#c0392b' }}>*</span>
        </label>
        <input
          id="phone"
          type="tel"
          value={project.phone}
          onChange={handlePhoneChange}
          placeholder="050-123-4567"
          dir="ltr"
          className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none"
          style={inputStyle}
        />
        {!project.phone.trim() ? (
          <p className="text-xs mt-1" style={{ color: '#c0392b' }}>יש להזין טלפון כדי להמשיך</p>
        ) : (
          <p className="text-xs mt-1" style={{ color: '#888' }}>כפתור ה-WhatsApp בדף ישתמש באותו מספר</p>
        )}
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={separateWA}
            onChange={(e) => toggleSeparateWA(e.target.checked)}
            className="w-4 h-4 rounded"
          />
          <span className="text-sm" style={{ color: '#111' }}>הוסף מספר WhatsApp שונה</span>
        </label>

        {separateWA && (
          <div>
            <label htmlFor="whatsapp" className="block text-sm font-medium mb-1" style={{ color: '#111' }}>
              מספר WhatsApp
            </label>
            <input
              id="whatsapp"
              type="text"
              value={project.whatsapp}
              onChange={(e) => onChange({ whatsapp: e.target.value.replace(/\D/g, '') })}
              placeholder="0501234567"
              dir="ltr"
              className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none"
              style={inputStyle}
            />
            <p className="text-xs mt-1" style={{ color: '#888' }}>
              ללא קידומת מדינה, לדוגמה: 0501234567
            </p>
          </div>
        )}
      </div>

      <div className="space-y-3 pt-5" style={{ borderTop: '1px solid #ddd' }}>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={openHouseOn}
            onChange={(e) => toggleOpenHouse(e.target.checked)}
            className="w-4 h-4 rounded"
          />
          <span className="text-sm" style={{ color: '#111' }}>קבע בית פתוח</span>
        </label>

        {openHouseOn && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="open-house-start" className="block text-sm font-medium mb-1" style={{ color: '#111' }}>
                תאריך ושעת התחלה
              </label>
              <input
                id="open-house-start"
                type="datetime-local"
                value={isoToLocalInput(project.openHouseDate)}
                onChange={(e) => onChange({ openHouseDate: localInputToIso(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none"
                style={inputStyle}
              />
            </div>
            <div>
              <label htmlFor="open-house-end" className="block text-sm font-medium mb-1" style={{ color: '#111' }}>
                שעת סיום <span className="font-normal" style={{ color: '#888' }}>(אופציונלי)</span>
              </label>
              <input
                id="open-house-end"
                type="datetime-local"
                value={isoToLocalInput(project.openHouseEnd)}
                onChange={(e) => onChange({ openHouseEnd: localInputToIso(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none"
                style={inputStyle}
              />
            </div>
            <p className="text-xs sm:col-span-2" style={{ color: '#888' }}>
              בדף הנכס יוצג באנר עם התאריך, ספירה לאחור וטופס הרשמה למבקרים — כל נרשם נכנס ללידים שלך.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
