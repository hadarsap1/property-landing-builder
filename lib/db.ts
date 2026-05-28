import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  // In development without a DB, most features degrade gracefully.
  // Routes check for the env var before calling db functions.
  console.warn('[db] DATABASE_URL not set — database features disabled');
}

// neon() returns a tagged-template SQL executor.
// It is cheap to call — no persistent connection is held.
export const sql = process.env.DATABASE_URL
  ? neon(process.env.DATABASE_URL)
  : null;

export function hasDb(): boolean {
  return sql !== null;
}
