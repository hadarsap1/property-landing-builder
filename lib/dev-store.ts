import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { hasDb } from '@/lib/db';
import type { PropertyProject } from '@/types/project';

// ── Dev-only filesystem project store ─────────────────────────────────────────
// Lets the full save → share → manage → status flow work locally when neither
// Postgres (DATABASE_URL) nor Vercel KV (KV_URL) is configured. Never used in
// production: `isDevStore()` is false the moment a real store exists.

const FILE = path.join(os.tmpdir(), 'plb-dev-projects.json');

/** True only when there is no real persistence configured (pure local dev). */
export function isDevStore(): boolean {
  return !hasDb() && !process.env.KV_URL;
}

async function readAll(): Promise<Record<string, PropertyProject>> {
  try {
    const raw = await fs.readFile(FILE, 'utf8');
    return JSON.parse(raw) as Record<string, PropertyProject>;
  } catch {
    return {};
  }
}

export async function devStoreGet(code: string): Promise<PropertyProject | null> {
  const all = await readAll();
  return all[code] ?? null;
}

export async function devStoreSet(code: string, project: PropertyProject): Promise<void> {
  const all = await readAll();
  all[code] = project;
  await fs.writeFile(FILE, JSON.stringify(all), 'utf8');
}
