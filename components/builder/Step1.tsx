'use client';

import { useEffect, useRef, useState } from 'react';
import type { PropertyProject } from '@/types/project';

interface StepProps {
  project: PropertyProject;
  onChange: (partial: Partial<PropertyProject>) => void;
}

const ROOM_OPTIONS = [
  1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10,
];

const ISRAELI_CITIES = [
  // ערים גדולות
  'ירושלים','תל אביב','חיפה','ראשון לציון','פתח תקווה','אשדוד','נתניה','באר שבע',
  'בני ברק','בת ים','חולון','רמת גן','אשקלון','רחובות','בית שמש','הרצליה',
  'כפר סבא','חדרה','מודיעין','לוד','רמלה','נצרת','קרית גת','עכו',
  // ערים בינוניות
  'נהריה','נס ציונה','יבנה','אור יהודה','גבעתיים','אלעד','קרית ביאליק',
  'קרית מוצקין','קרית אתא','הוד השרון','רמת השרון','רעננה','כפר יונה',
  'אריאל','מעלה אדומים','מודיעין עילית','גבעת שמואל','קרית אונו','יהוד',
  'אילת','דימונה','צפת','טבריה','עפולה','בית שאן','נצרת עילית',
  // ערים קטנות ויישובים עירוניים
  'כרמיאל','יוקנעם','קרית שמונה','מעלות תרשיחא','נתיבות','שדרות','ערד',
  'אופקים','ירוחם','מצפה רמון','קרית מלאכי','טירה','ג\'לג\'וליה',
  'כפר קאסם','רהט','ערערה','כפר מנדא','טמרה','אום אל-פחם','באקה אל-גרביה',
  'מג\'ד אל-כרום','עוספיה','דאלית אל-כרמל','פרדס חנה כרכור','זכרון יעקב',
  'עתלית','טירת כרמל','נשר','קרית ים','שפרעם','סח\'נין','מגדל העמק',
  'עראבה','כפר מסריק','אכסאל','משהד','ריינה','כפר כנא','כפר תבור',
  'כפר ורדים','מסעדה','חורפיש','פקיעין','עמקה','כאבול','ירכא',
  'טורעאן','עילוט','נין','דיר חנא','ח\'ולה','אבו גוש','אבו סנאן',
  // יישובים נוספים
  'גן יבנה','ניר ציון','מזכרת בתיה','כרם יבנה','יבנאל',
  'מגדל','טבריה','לביא','שבלי אום אל-גנם','אחיהוד',
  'כפר חסידים','עין כרמל','בנימינה','קיסריה','חדרה',
  'אלישיב','תל מונד','כפר סבא','הוד השרון','כוכב יאיר',
  'צור יצחק','בית אריה','מכבים-רעות','שוהם','ראש העין',
  'כפר שמריהו','הרצליה פיתוח','גני תקווה','אזור','יהוד מונוסון',
  'אור עקיבא','ציפורי','מגדל העמק','שמשית','כפר יהושע',
  'קרית טבעון','נשר','כפר חרוב','אפיקים','דגניה',
  'שלומי','מטולה','קריית שמונה','מנחמיה','כינרת',
  'גנוסר','כפר נהר','מצדה','עין גב','מעגן',
  'נחשולים','דור','עין כרמל','פוריידיס','ג\'סר אל-זרקא',
  'קיסריה','בנימינה גבעת עדה','זכרון יעקב','רמות מנשה',
  'גבעת ניל','ניר עם','שדה דוד','נגבה','קריית מלאכי',
  'ברור חיל','בית גוברין','כפר מנחם','בני עי\'ש','גדרה',
  'נס ציונה','ראשון לציון','ברקן','גבעת ברנר',
  'רחובות','נחל שורק','יבנה','אשדוד','בני דרום',
  'חולון','בת ים','אזור','צפריה','קריית עקרון',
  'גדרה','יבנה','עקרון','בית שמש','מטה יהודה',
  'בית זית','מבשרת ציון','מוצא','כסלון','בית מאיר',
  'גבעת יערים','שורש','צובה','הר אדר','גבעון החדשה',
  'ביר נבאלא','ג\'יב','בדו','בית נקופה','בית סוריק',
  'ניל','גבעת זאב','אלמוג','קריית ספר','ביתר עילית',
  'אפרת','גוש עציון','מעלה אדומים','מבשרת ציון',
].sort()

function useClickOutside(ref: React.RefObject<HTMLElement | null>, cb: () => void) {
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) cb()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [ref, cb])
}

interface ComboboxProps {
  value: string
  onChange: (val: string) => void
  options: string[]
  placeholder?: string
  disabled?: boolean
  loading?: boolean
  inputClassName?: string
  inputStyle?: React.CSSProperties
  id?: string
}

function Combobox({ value, onChange, options, placeholder, disabled, loading, inputClassName, inputStyle, id }: ComboboxProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value)
  const containerRef = useRef<HTMLDivElement>(null)
  const listboxId = id ? `${id}-listbox` : undefined

  // Keep local query in sync when parent resets the value (e.g. city change resets street)
  useEffect(() => { setQuery(value) }, [value])

  useClickOutside(containerRef, () => setOpen(false))

  const filtered = query.length >= 1
    ? options.filter((o) => o.includes(query)).slice(0, 10)
    : []

  const isOpen = open && query.length >= 1

  function select(opt: string) {
    onChange(opt)
    setQuery(opt)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        id={id}
        role="combobox"
        type="text"
        value={query}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete="off"
        aria-expanded={isOpen && filtered.length > 0}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-autocomplete="list"
        onChange={(e) => {
          setQuery(e.target.value)
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => { if (query.length >= 1) setOpen(true) }}
        className={inputClassName}
        style={inputStyle}
      />
      {loading && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#aaa' }} aria-hidden="true">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        </span>
      )}
      {isOpen && filtered.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-50 right-0 left-0 top-full mt-1 max-h-48 overflow-y-auto"
          style={{ background: '#fff', border: '2px solid #111', borderRadius: '8px' }}
          dir="rtl"
        >
          {filtered.map((opt) => (
            <li key={opt} role="option" aria-selected={opt === value}>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); select(opt) }}
                className="w-full text-right px-4 py-2.5 text-sm hover:bg-gray-100 transition-colors"
                style={{ color: '#111' }}
              >
                {opt}
              </button>
            </li>
          ))}
        </ul>
      )}
      {isOpen && !loading && filtered.length === 0 && (
        <div
          className="absolute z-50 right-0 left-0 top-full mt-1 p-3 text-sm text-right"
          style={{ background: '#fff', border: '2px solid #111', borderRadius: '8px', color: '#aaa' }}
          dir="rtl"
        >
          לא נמצאו תוצאות
        </div>
      )}
    </div>
  )
}

function useStreets(query: string) {
  const [streets, setStreets] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (query.length < 2) { setStreets([]); return }
    const ctrl = new AbortController()
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(
          `/api/location/streets?q=${encodeURIComponent(query)}`,
          { signal: ctrl.signal }
        )
        if (!res.ok) throw new Error('failed')
        const data = (await res.json()) as { streets: string[] }
        setStreets(data.streets ?? [])
      } catch {
        setStreets([])
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => { clearTimeout(t); ctrl.abort() }
  }, [query])

  return { streets, loading }
}

function Required() {
  return <span className="text-red-400 mr-0.5" title="שדה חובה">*</span>;
}

export default function Step1({ project, onChange }: StepProps) {
  const isRent = project.listingType === 'rent';
  const { streets, loading: streetsLoading } = useStreets(project.street)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold" style={{ color: '#111' }}>פרטי הנכס</h2>
        <p className="text-xs mt-1" style={{ color: '#aaa' }}>שדות המסומנים ב-* הם חובה</p>
      </div>

      {/* Listing type */}
      <div>
        <label className="block text-sm font-medium mb-3" style={{ color: '#111' }}>סוג העסקה</label>
        <div className="grid grid-cols-2 gap-3">
          {([
            { value: 'sale', emoji: '🏷️', label: 'למכירה' },
            { value: 'rent', emoji: '🔑', label: 'להשכרה' },
          ] as const).map((opt) => {
            const active = project.listingType === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange({ listingType: opt.value, furniture: '' })}
                className="flex flex-col items-center gap-2 py-5 rounded-lg border-2 transition-all font-semibold text-sm"
                style={{
                  border: '2px solid #111',
                  background: active ? '#111' : '#f7f5f2',
                  color: active ? '#f7f5f2' : '#555',
                }}
              >
                <span className="text-3xl">{opt.emoji}</span>
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-1" style={{ color: '#111' }}>
          שם/כותרת הנכס <Required />
        </label>
        <input
          id="title"
          type="text"
          value={project.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder={isRent ? 'לדוגמה: דירת 3 חדרים מרווחת בלב הצפון' : 'לדוגמה: דירת 4 חדרים עם נוף לים'}
          className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none"
          style={{ border: '2px solid #111', background: '#f7f5f2', color: '#111' }}
        />
        {!project.title.trim() && (
          <p className="text-xs mt-1" style={{ color: '#c0392b' }}>יש להזין כותרת לנכס כדי להמשיך</p>
        )}
      </div>

      {/* City (required) */}
      <div>
        <label htmlFor="city" className="block text-sm font-medium mb-1" style={{ color: '#111' }}>
          עיר <Required />
        </label>
        <Combobox
          id="city"
          value={project.city}
          onChange={(v) => onChange({ city: v, street: '' })}
          options={ISRAELI_CITIES}
          placeholder="תל אביב"
          inputClassName="w-full px-3 py-2 rounded-lg text-sm focus:outline-none"
          inputStyle={{ border: '2px solid #111', background: '#f7f5f2', color: '#111' }}
        />
        {!project.city.trim() && (
          <p className="text-xs mt-1" style={{ color: '#c0392b' }}>חובה לבחור עיר כדי להמשיך</p>
        )}
      </div>

      {/* Street — enabled after city is set */}
      <div>
        <label htmlFor="street" className="block text-sm font-medium mb-1" style={{ color: '#111' }}>רחוב</label>
        <Combobox
          id="street"
          value={project.street}
          onChange={(v) => onChange({ street: v })}
          options={streets}
          placeholder={project.city ? 'הרצל 12' : 'בחר עיר תחילה'}
          disabled={!project.city.trim()}
          loading={streetsLoading}
          inputClassName="w-full px-3 py-2 rounded-lg text-sm focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          inputStyle={{ border: '2px solid #111', background: '#f7f5f2', color: '#111' }}
        />
        {project.city && (
          <p className="text-xs mt-1" style={{ color: '#aaa' }}>הקלד לפחות 2 אותיות לחיפוש רחוב</p>
        )}
      </div>

      {/* Neighborhood */}
      <div>
        <label htmlFor="neighborhood" className="block text-sm font-medium mb-1" style={{ color: '#111' }}>שכונה</label>
        <input
          id="neighborhood"
          type="text"
          value={project.neighborhood}
          onChange={(e) => onChange({ neighborhood: e.target.value })}
          placeholder="פלורנטין"
          className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none"
          style={{ border: '2px solid #111', background: '#f7f5f2', color: '#111' }}
        />
      </div>

      {/* Price */}
      <div>
        <label htmlFor="price" className="block text-sm font-medium mb-2" style={{ color: '#111' }}>
          {isRent ? 'מחיר שכירות לחודש' : 'מחיר מכירה'}
        </label>
        <div className="flex items-center gap-3 mb-3">
          <input
            type="checkbox"
            id="priceOnRequest"
            checked={project.priceOnRequest}
            onChange={(e) => onChange({ priceOnRequest: e.target.checked, price: e.target.checked ? null : project.price })}
            className="w-4 h-4 rounded"
          />
          <label htmlFor="priceOnRequest" className="text-sm" style={{ color: '#111' }}>
            לא להציג מחיר בדף
          </label>
        </div>
        {!project.priceOnRequest && (
          <div className="relative">
            <span className="absolute right-3 top-1/2 -translate-y-1/2 font-medium" style={{ color: '#555' }}>₪</span>
            <input
              id="price"
              type="number"
              value={project.price ?? ''}
              onChange={(e) => onChange({ price: e.target.value ? Number(e.target.value) : null })}
              placeholder={isRent ? '5,500' : '2,500,000'}
              min={0}
              className="w-full pr-8 pl-3 py-2 rounded-lg text-sm focus:outline-none"
              style={{ border: '2px solid #111', background: '#f7f5f2', color: '#111' }}
            />
            {isRent && (
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#888' }}>לחודש</span>
            )}
          </div>
        )}
        {!project.priceOnRequest && !project.price && (
          <p className="text-xs mt-1" style={{ color: '#c0392b' }}>הזן מחיר או סמן &quot;לא להציג מחיר בדף&quot;</p>
        )}
      </div>

      {/* Furniture — rent only */}
      {isRent && (
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#111' }}>ריהוט</label>
          <div className="grid grid-cols-3 gap-2">
            {([
              { value: 'none', label: 'ללא ריהוט' },
              { value: 'partial', label: 'ריהוט חלקי' },
              { value: 'full', label: 'מרוהטת מלאה' },
            ] as const).map((opt) => {
              const active = project.furniture === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onChange({ furniture: opt.value })}
                  className="py-2.5 px-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    border: '2px solid #111',
                    background: active ? '#111' : '#f7f5f2',
                    color: active ? '#f7f5f2' : '#555',
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Areas */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="built-area" className="block text-sm font-medium mb-1" style={{ color: '#111' }}>
            שטח בנוי <span className="font-normal" style={{ color: '#888' }}>מ״ר</span>
          </label>
          <input
            id="built-area"
            type="number"
            value={project.builtArea ?? ''}
            onChange={(e) => onChange({ builtArea: e.target.value ? Number(e.target.value) : null })}
            placeholder="90"
            min={0}
            className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none"
            style={{ border: '2px solid #111', background: '#f7f5f2', color: '#111' }}
          />
        </div>
        <div>
          <label htmlFor="garden-area" className="block text-sm font-medium mb-1" style={{ color: '#111' }}>
            גינה/מרפסת{' '}
            <span className="font-normal" style={{ color: '#888' }}>מ״ר</span>
          </label>
          <input
            id="garden-area"
            type="number"
            value={project.gardenArea ?? ''}
            onChange={(e) => onChange({ gardenArea: e.target.value ? Number(e.target.value) : null })}
            placeholder="20"
            min={0}
            className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none"
            style={{ border: '2px solid #111', background: '#f7f5f2', color: '#111' }}
          />
        </div>
      </div>

      {/* Rooms */}
      <div>
        <label htmlFor="rooms" className="block text-sm font-medium mb-1" style={{ color: '#111' }}>מספר חדרים</label>
        <select
          id="rooms"
          value={project.rooms ?? ''}
          onChange={(e) => onChange({ rooms: e.target.value ? Number(e.target.value) : null })}
          className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none"
          style={{ border: '2px solid #111', background: '#f7f5f2', color: '#111' }}
        >
          <option value="">בחר...</option>
          {ROOM_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {r} חדרים
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
