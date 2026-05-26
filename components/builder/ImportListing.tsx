'use client';

import { useState } from 'react';
import type { PropertyProject } from '@/types/project';
import type { ImportedListing } from '@/app/api/import-listing/route';

interface Props {
  onImport: (partial: Partial<PropertyProject>) => void;
  onSkip: () => void;
}

const AIR_LABEL: Record<string, string> = { N: 'צפון', S: 'דרום', E: 'מזרח', W: 'מערב' };

function FieldBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
      <span className="text-xs text-blue-500 font-medium">{label}</span>
      <span className="text-sm text-gray-800 font-semibold">{value}</span>
    </div>
  );
}

function listingToProject(listing: ImportedListing): Partial<PropertyProject> {
  const partial: Partial<PropertyProject> = {};

  if (listing.title) partial.title = listing.title;
  if (listing.street) partial.street = listing.street;
  if (listing.city) partial.city = listing.city;
  if (listing.neighborhood) partial.neighborhood = listing.neighborhood;
  if (listing.price != null) partial.price = listing.price;
  if (listing.priceOnRequest != null) partial.priceOnRequest = listing.priceOnRequest;
  if (listing.builtArea != null) partial.builtArea = listing.builtArea;
  if (listing.gardenArea != null) partial.gardenArea = listing.gardenArea;
  if (listing.rooms != null) partial.rooms = listing.rooms;
  if (listing.floor != null) partial.floor = listing.floor;
  if (listing.totalFloors != null) partial.totalFloors = listing.totalFloors;
  if (listing.parkingSpots != null) partial.parkingSpots = listing.parkingSpots;
  if (listing.parkingType) partial.parkingType = listing.parkingType;
  if (listing.hasStorage != null) partial.hasStorage = listing.hasStorage;
  if (listing.hasSaferoom != null) partial.hasSaferoom = listing.hasSaferoom;
  if (listing.hasElevator != null) partial.hasElevator = listing.hasElevator;
  if (listing.airDirections?.length) partial.airDirections = listing.airDirections;
  if (listing.buildYear != null) partial.buildYear = listing.buildYear;
  if (listing.renovationYear != null) partial.renovationYear = listing.renovationYear;
  if (listing.bathrooms != null) partial.bathrooms = listing.bathrooms;
  if (listing.rawStory) partial.rawStory = listing.rawStory;

  // Auto-build mapQuery
  if (listing.street || listing.city) {
    partial.mapQuery = `${listing.street ?? ''}, ${listing.city ?? ''}, ישראל`.replace(/^, /, '');
  }

  return partial;
}

function buildPreview(listing: ImportedListing): { label: string; value: string }[] {
  const items: { label: string; value: string }[] = [];

  if (listing.city || listing.street) {
    items.push({ label: 'כתובת', value: [listing.street, listing.neighborhood, listing.city].filter(Boolean).join(', ') });
  }
  if (listing.price) items.push({ label: 'מחיר', value: `₪${listing.price.toLocaleString('he-IL')}` });
  if (listing.priceOnRequest) items.push({ label: 'מחיר', value: 'לפי פניה' });
  if (listing.rooms) items.push({ label: 'חדרים', value: `${listing.rooms}` });
  if (listing.builtArea) items.push({ label: 'שטח', value: `${listing.builtArea} מ״ר` });
  if (listing.gardenArea) items.push({ label: 'גינה/מרפסת', value: `${listing.gardenArea} מ״ר` });
  if (listing.floor != null) {
    const floorStr = listing.totalFloors ? `קומה ${listing.floor} מתוך ${listing.totalFloors}` : `קומה ${listing.floor}`;
    items.push({ label: 'קומה', value: floorStr });
  }
  if (listing.bathrooms) items.push({ label: 'שירותים', value: `${listing.bathrooms}` });
  if (listing.buildYear) items.push({ label: 'שנת בנייה', value: `${listing.buildYear}` });
  if (listing.parkingSpots) {
    const parkLabel = listing.parkingType === 'covered' ? 'מקורה' : listing.parkingType === 'outdoor' ? 'חיצונית' : '';
    items.push({ label: 'חניה', value: `${listing.parkingSpots}${parkLabel ? ` (${parkLabel})` : ''}` });
  }
  const extras: string[] = [];
  if (listing.hasStorage) extras.push('מחסן');
  if (listing.hasSaferoom) extras.push('ממ"ד');
  if (listing.hasElevator) extras.push('מעלית');
  if (extras.length) items.push({ label: 'תוספות', value: extras.join(' · ') });
  if (listing.airDirections?.length) {
    items.push({ label: 'כיוונים', value: listing.airDirections.map((d) => AIR_LABEL[d] ?? d).join(', ') });
  }

  return items;
}

export default function ImportListing({ onImport, onSkip }: Props) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ImportedListing | null>(null);
  const fieldCount = result ? buildPreview(result).length + (result.rawStory ? 1 : 0) : 0;

  async function handleParse() {
    if (!text.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/import-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json() as { listing?: ImportedListing; error?: string };
      if (!res.ok || data.error) {
        setError(data.error ?? 'שגיאה בלתי צפויה');
        return;
      }
      setResult(data.listing ?? null);
    } catch {
      setError('שגיאת רשת. בדוק חיבור אינטרנט');
    } finally {
      setLoading(false);
    }
  }

  function handleConfirm() {
    if (!result) return;
    onImport(listingToProject(result));
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">📋 טען ממודעה קיימת</h2>
        <p className="text-sm text-gray-500">
          העתק את טקסט המודעה מיד2, מדלן, או כל אתר אחר, והדבק כאן.
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          תוכן המודעה
        </label>
        <textarea
          value={text}
          onChange={(e) => { setText(e.target.value); setResult(null); setError(''); }}
          rows={10}
          disabled={loading}
          placeholder={`לדוגמה:

דירת 4 חדרים למכירה בהרצליה פיתוח, רח׳ הנשיאים 12
קומה 5 מתוך 8, מעלית, חניה מקורה, מחסן, ממ"ד
שטח: 102 מ"ר + מרפסת 15 מ"ר
מחיר: 3,200,000 ₪
בניין משנת 2008, שיפוץ 2022
3 חדרי שינה, 2 שירותים
כיוונים: דרום-מערב
...`}
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400 leading-relaxed"
        />
        <p className="text-xs text-gray-400">
          ככל שתדביק יותר טקסט, כך יזוהו יותר שדות אוטומטית
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Parse button */}
      {!result && (
        <button
          type="button"
          onClick={handleParse}
          disabled={loading || text.trim().length < 20}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition-colors disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              מנתח מודעה...
            </>
          ) : (
            <>✨ נתח מודעה</>
          )}
        </button>
      )}

      {/* Results preview */}
      {result && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-green-600 text-lg">✅</span>
            <span className="font-semibold text-gray-800">
              זיהיתי {fieldCount} שדות מהמודעה
            </span>
          </div>

          {result.title && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
              <span className="text-xs text-gray-500 block mb-0.5">כותרת</span>
              <span className="font-semibold text-gray-900">{result.title}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {buildPreview(result).map(({ label, value }) => (
              <FieldBadge key={label} label={label} value={value} />
            ))}
          </div>

          {result.rawStory && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
              <span className="text-xs text-gray-500 block mb-1">תיאור שיועבר לשלב "הסיפור"</span>
              <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed">{result.rawStory}</p>
            </div>
          )}

          <p className="text-xs text-gray-400">
            כל השדות ניתנים לעריכה בשלבים הבאים
          </p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              אשר והמשך ←
            </button>
            <button
              type="button"
              onClick={() => { setResult(null); setText(''); }}
              className="px-4 py-3 border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors text-sm"
            >
              נסה שוב
            </button>
          </div>
        </div>
      )}

      {/* Skip */}
      <div className="border-t border-gray-100 pt-4 text-center">
        <button
          type="button"
          onClick={onSkip}
          className="text-sm text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
        >
          התחל מאפס בלי לייבא מודעה
        </button>
      </div>
    </div>
  );
}
