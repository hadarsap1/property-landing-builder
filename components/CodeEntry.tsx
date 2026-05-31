'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Compact "enter your 6-digit code" box for the home page. Opens the saved
 * property page (`/preview/<code>`) — the destination promised by the Step 9 tip.
 */
export default function CodeEntry() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const valid = /^\d{6}$/.test(code);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) router.push(`/preview/${code}`);
      }}
      className="flex items-center gap-2"
      dir="rtl"
    >
      <input
        inputMode="numeric"
        pattern="\d{6}"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
        placeholder="קוד נכס (6 ספרות)"
        aria-label="קוד נכס בן 6 ספרות"
        className={`w-48 text-sm rounded-lg py-2 px-3 ${
          code ? 'text-center font-mono tracking-widest' : 'text-right'
        }`}
        style={{ background: 'var(--pb-surface)', border: '1px solid var(--pb-border)', color: 'var(--pb-text)' }}
      />
      <button
        type="submit"
        disabled={!valid}
        className="text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-40"
        style={{ background: 'var(--pb-surface)', border: '1px solid var(--pb-border)', color: 'var(--pb-text)' }}
      >
        פתח
      </button>
    </form>
  );
}
