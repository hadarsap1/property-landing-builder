# PropBuilder — Property Landing Page Builder

A full-stack SaaS platform for real-estate agencies to create beautiful, SEO-optimised property listing pages with AI-generated content, lead capture, analytics, and automated email workflows.

## Features

### For Agencies (Broker Dashboard)
- **Property listings** — rich listing editor with photos, specs, AI-generated title/tagline/story, and a public landing page per listing
- **AI Chat widget** — floating Q&A bot on every public listing page, trained on listing data (rooms, parking, HOA, etc.)
- **AI social posts** — one-click Facebook/Instagram copy generation
- **Printable flyer** — A4 print-ready flyer with QR code at `/flyer/[id]`
- **Lead management** — lead capture from contact forms, WhatsApp, and open-house registrations; pipeline statuses, notes, follow-up reminders
- **Open house events** — schedule open houses; visitor registration with automatic email reminder sent the morning before
- **WhatsApp quick-remind** — one-click pre-filled WhatsApp reminder for open-house leads from the lead detail view
- **Calendar** — schedule buyer/seller showings, linked to lead records
- **Analytics funnel** — page views → unique visitors → contact clicks → leads; per-listing breakdown; UTM source tracking
- **Weekly digest email** — automated Monday morning performance summary emailed to every agent
- **Team management** — invite agents, role-based access (admin / agent)
- **Seller collaboration** — send sellers a magic link to submit price/description/photo updates; changes require agent approval before publishing
- **Custom domains** — connect a custom hostname (CNAME → `cname.vercel-dns.com`); listing pages served from the agency's own domain
- **SEO** — schema.org `RealEstateListing` JSON-LD, `<title>`, Open Graph, Twitter Card, per-agency sitemap.xml + robots.txt
- **Sticky contact bar** — mobile-optimised call/WhatsApp bar that appears on scroll

### For Private Sellers (Personal tier)
- Free shareable property page — no account needed beyond email
- Upload photos, edit details, mark as sold
- AI-generated listing copy

### Platform
- **Subscription billing** via Stripe — 14-day free trial, monthly/yearly plans
- **Sub-domain routing** — each agency served on `{slug}.yourdomain.com`
- **Custom domain routing** — edge proxy resolves custom domains to the owning agency

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Database | PostgreSQL via `@vercel/postgres` (Neon protocol); falls back to `node-postgres` for localhost |
| Auth | NextAuth v5 (credentials + Google OAuth) |
| Storage | Vercel Blob |
| AI | Anthropic Claude (`claude-haiku-4-5-20251001` / `claude-sonnet-4-6` configurable) |
| Email | Nodemailer (any SMTP) |
| Payments | Stripe |
| Styling | Tailwind CSS |
| Testing | Playwright (E2E, mobile + desktop Chromium) |
| Deployment | Vercel |

---

## Local Development

### Prerequisites
- Node.js 20+
- PostgreSQL 15+ running locally (or a Neon/Supabase connection string)
- An Anthropic API key

### 1. Clone and install

```bash
git clone https://github.com/hadarsap1/property-landing-builder
cd property-landing-builder
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in the required values:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|---|---|---|
| `POSTGRES_URL` | ✅ | `postgresql://user:pass@host:5432/dbname` |
| `AUTH_SECRET` | ✅ | Random 32-char string (`openssl rand -hex 32`) |
| `NEXTAUTH_URL` | ✅ | `http://localhost:3000` in dev |
| `ANTHROPIC_API_KEY` | ✅ | Claude API key for AI features |
| `BLOB_READ_WRITE_TOKEN` | ✅ | Vercel Blob token for image uploads |
| `EMAIL_SERVER` | ✅ | SMTP URL e.g. `smtp://user:pass@smtp.example.com:587` |
| `EMAIL_FROM` | ✅ | `"PropBuilder" <no-reply@example.com>` |
| `STRIPE_SECRET_KEY` | For billing | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | For billing | Stripe webhook signing secret |
| `STRIPE_PRICE_MONTHLY` | For billing | Stripe Price ID (monthly) |
| `STRIPE_PRICE_YEARLY` | For billing | Stripe Price ID (yearly) |
| `ROOT_DOMAIN` | Production | Base domain for subdomain routing |
| `CRON_SECRET` | Production | Bearer token for cron job endpoints |
| `VERCEL_TOKEN` | Optional | Auto-registers custom domains via Vercel API |
| `VERCEL_PROJECT_ID` | Optional | Required with `VERCEL_TOKEN` |
| `SUPER_ADMIN_EMAIL` | Optional | Receives admin alert emails |
| `GOOGLE_CLIENT_ID` | Optional | Enables Google OAuth login |

### 3. Start the dev server

```bash
npm run dev
```

The schema is applied automatically on first request (`lib/db/ensure-schema.ts` runs idempotent `ALTER TABLE / CREATE TABLE IF NOT EXISTS` migrations).

To seed initial admin data, call the one-time setup route with your `SETUP_SECRET`:

```
POST /api/admin/setup   { "secret": "<SETUP_SECRET>" }
```

---

## Architecture

```
app/
  agency/[slug]/          ← public listing pages + sitemap + robots.txt
  api/
    cron/                 ← open-house-reminders (daily 06:00 UTC)
                             weekly-digest (Monday 05:00 UTC)
    listings/[id]/        ← builder PATCH endpoint (column allowlist)
    leads/                ← lead creation + pipeline management
    analytics/            ← event tracking + funnel query
    agency/               ← agency settings PATCH (custom domain)
  dashboard/              ← authenticated broker SPA
  personal/               ← unauthenticated private seller flow
  preview/[code]/         ← shareable draft preview
  flyer/[id]/             ← printable A4 flyer (noindex)

lib/
  db/
    index.ts              ← @vercel/postgres + node-postgres fallback adapter
    ensure-schema.ts      ← idempotent schema migrations
    queries/              ← type-safe query functions per domain
  email.ts                ← nodemailer wrappers (all HTML is entity-escaped)
  listings/seo.ts         ← canonical URL + JSON-LD helpers

proxy.ts                  ← edge middleware: custom-domain → agency slug routing
vercel.json               ← Vercel Cron schedules
```

### Database migrations

There is no migration framework. `ensure-schema.ts` contains an ordered array of `CREATE TABLE IF NOT EXISTS` and `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` statements that run at startup. Add new statements to the **end** of the array — they are idempotent and safe to re-run.

### Column allowlists

API routes never accept arbitrary column names. Each table has a typed allowlist:

- `LISTING_COLUMNS` / `CLIENT_WRITABLE_COLUMNS` in `lib/db/queries/listings.ts`
- `AGENCY_WRITABLE_COLUMNS` in `lib/db/queries/agencies.ts`
- `AGENT_WRITABLE_COLUMNS` in `lib/db/queries/agents.ts`

### Custom domain routing

`proxy.ts` (Next.js 16 edge middleware convention) resolves incoming hostnames:

1. Subdomain of `ROOT_DOMAIN` → extract slug, rewrite to `/agency/{slug}/…`
2. Unknown hostname → look up `agencies.custom_domain`, cache for 5 minutes, rewrite to owning agency's slug
3. Dashboard / API paths → pass through unchanged

---

## E2E Testing

```bash
# Start Postgres and seed fixtures
pg_ctlcluster 16 main start
POSTGRES_URL=postgresql://e2e:e2e@localhost:5432/e2e npx tsx e2e/setup-db.ts

# Build and run
npm run build
npm run test:e2e
```

The suite (`e2e/smoke.spec.ts`) covers 16 tests across mobile and desktop Chromium:
- Home page layout
- Public listing page (JSON-LD, contact CTAs)
- Lead form submission
- Builder iframe preview
- Full builder PATCH payload
- Column-rejection guard
- Sitemap + robots.txt

---

## Cron Jobs

| Route | Schedule | What it does |
|---|---|---|
| `/api/cron/open-house-reminders` | Daily 06:00 UTC | Emails open-house registrants whose listing's open house is tomorrow; stamps `open_house_reminder_sent_at` to prevent duplicates |
| `/api/cron/weekly-digest` | Monday 05:00 UTC | Sends each active agent a Hebrew RTL digest: 7-day stats (views, visitors, clicks, leads), week-over-week trends, top-5 listings, upcoming open houses |

Both routes require `Authorization: Bearer <CRON_SECRET>`. Vercel injects this header automatically from the project environment variable.

---

## Security Notes

- All user-controlled strings in HTML email templates are passed through `escHtml()` before interpolation
- Cron endpoints return `503` if `CRON_SECRET` is not set (fail-closed, not fail-open)
- API column updates use typed allowlists + `/^[a-z_]+$/` regex backstop
- Custom domain values are validated against an RFC-compliant hostname regex before DB write and Vercel API call
- SQL queries use parameterised tagged-template literals (`sql\`...\``) throughout; no string concatenation of user input

---

## Deployment

Push to `main` deploys automatically to Vercel. Production checklist:

- [ ] Set all required env vars in Vercel project settings
- [ ] Add `CRON_SECRET` — the Vercel scheduler injects it into cron HTTP calls automatically
- [ ] Point `ROOT_DOMAIN` to your apex domain; configure wildcard `*.yourdomain.com` DNS to Vercel
- [ ] Configure Stripe webhook endpoint: `https://yourdomain.com/api/billing/webhook`
- [ ] Run the one-time setup route to seed the super-admin account
