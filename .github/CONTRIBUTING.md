# Contributing to PropBuilder

## Development setup

```bash
git clone https://github.com/hadarsap1/property-landing-builder
cd property-landing-builder
npm install
cp .env.example .env.local   # fill in POSTGRES_URL, AUTH_SECRET, ANTHROPIC_API_KEY, etc.
npm run dev
```

See [`README.md`](../README.md) for the full environment variable reference.

## Branch model

All work goes on feature branches off `main`. Open a PR when ready.

## Code conventions

- **TypeScript** — `strict` mode, no `any`. Run `npx tsc --noEmit` before pushing.
- **Lint** — `npm run lint` (Next.js ESLint config). Must be error-free; warnings are advisory.
- **SQL** — always use the `sql` tagged-template literal or `db.query` with positional parameters. Never interpolate user input into SQL strings.
- **Email HTML** — all user-controlled strings must be wrapped in `escHtml()` from `lib/email.ts` before interpolation into HTML templates.
- **DB migrations** — add new `ALTER TABLE … ADD COLUMN IF NOT EXISTS` statements to the **end** of the `SCHEMA_STATEMENTS` array in `lib/db/ensure-schema.ts`. Never edit existing statements.
- **Column allowlists** — adding a new writable column requires updating the appropriate `*_WRITABLE_COLUMNS` set and the corresponding TypeScript `Pick<>` type.
- **Comments** — only when the *why* is non-obvious. No docblocks, no `// added for X` notes.
- **No half-finished features** — don't add flags, stubs, or TODO blocks. Implement fully or don't merge.

## Adding a new cron job

1. Create `app/api/cron/<name>/route.ts` with `export const runtime = 'nodejs'`
2. Add the auth guard (fail-closed — reject when `CRON_SECRET` is missing):
   ```ts
   const secret = process.env.CRON_SECRET
   if (!secret) return NextResponse.json({ error: 'Service misconfigured' }, { status: 503 })
   if (req.headers.get('authorization') !== `Bearer ${secret}`)
     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
   ```
3. Add the schedule to `vercel.json` under `"crons"`.

## E2E tests

```bash
# Postgres must be running and seeded
POSTGRES_URL=postgresql://e2e:e2e@localhost:5432/e2e npx tsx e2e/setup-db.ts
npm run build
npm run test:e2e
```

Tests live in `e2e/smoke.spec.ts`. Add new specs in the same file or a new `*.spec.ts` file in `e2e/`. Tests run against real Chromium (no mocks).

## Submitting a PR

- Make sure `npx tsc --noEmit` and `npm run lint` are both clean
- E2E suite passes locally
- PR description explains *why*, not just *what*
