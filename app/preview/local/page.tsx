'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { PropertyProject } from '@/types/project';
import PreviewContent from '../_preview-content';

export default function LocalPreviewPage() {
  const [project, setProject] = useState<PropertyProject | null>(null);
  const [empty, setEmpty] = useState(false);
  const [isEmbed, setIsEmbed] = useState(false);

  // Load initial data from localStorage + detect embed mode
  useEffect(() => {
    setIsEmbed(new URLSearchParams(window.location.search).get('embed') === '1');

    const saved = localStorage.getItem('property-builder-draft');
    if (!saved) { setEmpty(true); return; }
    try {
      setProject(JSON.parse(saved) as PropertyProject);
    } catch {
      setEmpty(true);
    }
  }, []);

  // Listen for real-time postMessage updates from builder split-view
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if ((event.data as { type?: string } | null)?.type !== 'plb-update') return;
      const updated = (event.data as { type: string; project: PropertyProject }).project;
      setProject(updated);
      setEmpty(false);
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  if (empty) {
    if (isEmbed) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3">
          <div className="text-5xl">🏠</div>
          <p className="text-sm text-gray-400">ממתין לנתוני הנכס...</p>
        </div>
      );
    }
    return (
      <div
        dir="rtl"
        lang="he"
        className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center"
      >
        <div className="text-5xl mb-4">📭</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">אין טיוטה שמורה</h1>
        <p className="text-gray-500 mb-6">עדיין לא יצרתם דף נחיתה.</p>
        <Link
          href="/builder"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          התחל עכשיו
        </Link>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm">טוען...</div>
      </div>
    );
  }

  // In embed mode: no edit bar (builder is right there in the parent page)
  return <PreviewContent project={project} editHref={isEmbed ? undefined : '/builder'} />;
}
