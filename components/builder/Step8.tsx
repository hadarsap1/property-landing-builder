'use client';

import { useState } from 'react';
import type { PropertyProject } from '@/types/project';

interface StepProps {
  project: PropertyProject;
  onChange: (partial: Partial<PropertyProject>) => void;
}

/** ISO string → value usable by <input type="datetime-local"> (local time, minute precision) */
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

export default function Step8({ project, onChange }: StepProps) {
  // "separate WA" is active when a different whatsapp number is already saved
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
    if (!checked) {
      // clear the separate WA number — preview will fall back to phone
      onChange({ whatsapp: '' });
    }
  }

  function toggleOpenHouse(checked: boolean) {
    setOpenHouseOn(checked);
    if (!checked) onChange({ openHouseDate: '', openHouseEnd: '' });
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">פרטי יצירת קשר</h2>

      {/* Seller name */}
      <div>
        <label htmlFor="seller-name" className="block text-sm font-medium text-gray-700 mb-1">שם המוכר</label>
        <input
          id="seller-name"
          type="text"
          value={project.sellerName}
          onChange={(e) => onChange({ sellerName: e.target.value })}
          placeholder="ישראל ישראלי"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
          טלפון <span className="text-red-500">*</span>
        </label>
        <input
          id="phone"
          type="tel"
          value={project.phone}
          onChange={handlePhoneChange}
          placeholder="050-123-4567"
          dir="ltr"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {!project.phone.trim() ? (
          <p className="text-xs text-amber-600 mt-1">יש להזין טלפון כדי להמשיך</p>
        ) : (
          <p className="text-xs text-gray-400 mt-1">כפתור ה-WhatsApp בדף ישתמש באותו מספר</p>
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
          <span className="text-sm text-gray-700">הוסף מספר WhatsApp שונה</span>
        </label>

        {separateWA && (
          <div>
            <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700 mb-1">
              מספר WhatsApp
            </label>
            <input
              id="whatsapp"
              type="text"
              value={project.whatsapp}
              onChange={(e) => onChange({ whatsapp: e.target.value.replace(/\D/g, '') })}
              placeholder="0501234567"
              dir="ltr"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              ללא קידומת מדינה, לדוגמה: 0501234567
            </p>
          </div>
        )}
      </div>

      {/* Open house scheduling */}
      <div className="space-y-3 border-t border-gray-100 pt-5">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={openHouseOn}
            onChange={(e) => toggleOpenHouse(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded"
          />
          <span className="text-sm text-gray-700">🏠 קבע בית פתוח</span>
        </label>

        {openHouseOn && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="open-house-start" className="block text-sm font-medium text-gray-700 mb-1">
                תאריך ושעת התחלה
              </label>
              <input
                id="open-house-start"
                type="datetime-local"
                value={isoToLocalInput(project.openHouseDate)}
                onChange={(e) => onChange({ openHouseDate: localInputToIso(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="open-house-end" className="block text-sm font-medium text-gray-700 mb-1">
                שעת סיום <span className="text-gray-400 font-normal">(אופציונלי)</span>
              </label>
              <input
                id="open-house-end"
                type="datetime-local"
                value={isoToLocalInput(project.openHouseEnd)}
                onChange={(e) => onChange({ openHouseEnd: localInputToIso(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <p className="text-xs text-gray-400 sm:col-span-2">
              בדף הנכס יוצג באנר עם התאריך, ספירה לאחור וטופס הרשמה למבקרים — כל נרשם נכנס ללידים שלך.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
