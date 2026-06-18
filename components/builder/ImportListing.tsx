'use client';

import { useState } from 'react';
import type { PropertyProject } from '@/types/project';
import type { ImportedListing } from '@/app/api/import-listing/route';

interface Props {
  onImport: (partial: Partial<PropertyProject>) => void;
  onSkip: () => void;
  agencyId?: string;
}

const AIR_LABEL: Record<string, string> = { N: 'צפון', S: 'דרום', E: 'מזרח', W: 'מערב' };

function FieldBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: '#f7f5f2', border: '1px solid #ccc' }}>
      <span className="text-xs font-medium" style={{ color: '#888' }}>{label}</span>
      <span className="text-sm font-semibold" style={{ color: '#111' }}>{value}</span>
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
    items.push({ label: 'כיוונים', value: listing.airDirections.map((d: string) => AIR_LABEL[d] ?? d).join(', ') });
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
        <h2 className="text-xl font-bold mb-1" style={{ color: '#111' }}>טען ממודעה קיימת</h2>
        <p className="text-sm" style={{ color: '#888' }}>
          העתק את טקסט המודעה מיד2, מדלן, או כל אתר אחר, והדבק כאן.
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium" style={{ color: '#111' }}>
          תוכן המודעה
        </label>
        <textarea
          value={text}
          onChange={(e) => { setText(e.target.value); setResult(null); setError(''); }}
          rows={10}
          disabled={loading}
          placeholder={`לדוגמה:\n\nדירת 4 חדרים למכירה בהרצליה פיתוח, רח׳ הנשיאים 12\nקומה 5 מתוך 8, מעלית, חניה מקורה, מחסן, ממ"ד\nשטח: 102 מ"ר + מרפסת 15 מ"ר\nמחיר: 3,200,000 ₪\n...`}
          className="w-full px-4 py-3 text-sm resize-none focus:outline-none leading-relaxed rounded-lg disabled:opacity-50"
          style={{ border: '2px solid #111', background: '#f7f5f2', color: '#111' }}
        />
        <p className="text-xs" style={{ color: '#aaa' }}>
          ככל שתדביק יותר טקסט, כך יזוהו יותר שדות אוטומטית
        </p>
      </div>

      {error && (
        <div className="rounded-lg px-4 py-3 text-sm" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' }}>
          {error}
        </div>
      )}

      {!result && (
        <button
          type="button"
          onClick={handleParse}
          disabled={loading || text.trim().length < 20}
          className="w-full flex items-center justify-center gap-2 font-semibold py-3 rounded-lg transition-opacity hover:opacity-85 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: '#111' }}
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

      {result && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-lg" style={{ color: '#16a34a' }}>✅</span>
            <span className="font-semibold" style={{ color: '#111' }}>
              זיהיתי {fieldCount} שדות מהמודעה
            </span>
          </div>

          {result.title && (
            <div className="rounded-lg px-4 py-3" style={{ background: '#f7f5f2', border: '1px solid #ccc' }}>
              <span className="text-xs block mb-0.5" style={{ color: '#888' }}>כותרת</span>
              <span className="font-semibold" style={{ color: '#111' }}>{result.title}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {buildPreview(result).map(({ label, value }) => (
              <FieldBadge key={label} label={label} value={value} />
            ))}
          </div>

          {result.rawStory && (
            <div className="rounded-lg px-4 py-3" style={{ background: '#f7f5f2', border: '1px solid #ccc' }}>
              <span className="text-xs block mb-1" style={{ color: '#888' }}>תיאור שיועבר לשלב &quot;הסיפור&quot;</span>
              <p className="text-sm line-clamp-3 leading-relaxed" style={{ color: '#555' }}>{result.rawStory}</p>
            </div>
          )}

          <p className="text-xs" style={{ color: '#aaa' }}>
            כל השדות ניתנים לעריכה בשלבים הבאים
          </p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 font-semibold py-3 rounded-lg transition-opacity hover:opacity-85 text-white"
              style={{ background: '#c0392b' }}
            >
              אשר והמשך ←
            </button>
            <button
              type="button"
              onClick={() => { setResult(null); setText(''); }}
              className="px-4 py-3 rounded-lg transition-opacity hover:opacity-70 text-sm"
              style={{ border: '2px solid #111', color: '#111' }}
            >
              נסה שוב
            </button>
          </div>
        </div>
      )}

      <div className="pt-4 text-center" style={{ borderTop: '1px solid #ddd' }}>
        <button
          type="button"
          onClick={onSkip}
          className="text-sm underline underline-offset-2 transition-opacity hover:opacity-60"
          style={{ color: '#aaa' }}
        >
          התחל מאפס בלי לייבא מודעה
        </button>
      </div>
    </div>
  );
}
