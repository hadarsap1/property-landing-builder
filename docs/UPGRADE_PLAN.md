# Upgrade Plan — Security, UX/UI, and General QA

Date: 2026-06-10. Based on a full review of the codebase (121 TS/TSX files, ~13.4k lines, 37 API routes, zero tests, no CI).

## Snapshot of current state

**What's already solid:** Stripe webhook signature verification (`app/api/billing/webhook/route.ts`), parameterized SQL via `@vercel/postgres`, `crypto.randomUUID()` for seller/invite tokens, bcrypt password hashing, well-indexed schema with FKs and triggers, IP rate limiting on anonymous listing creation, good empty states and skeleton loaders in the dashboard, mobile-friendly builder wizard.

**Main gaps:** no tests/CI at all, no auth gating in `proxy.ts` (every route self-protects, inconsistently), predictable project codes, no request validation layer, silent error swallowing throughout the client, schema defined in two places, accessibility gaps in the Hebrew/RTL forms.

---

## Phase 1 — Security hardening (do first)

### Critical
1. **Predictable project codes** — `app/api/save-project/route.ts:20` generates 6-digit codes with `Math.random()`; anyone can enumerate 000000–999999 and read/overwrite other users' saved projects. Replace with `crypto.randomUUID()` (or ≥128-bit random string), and migrate existing codes.
2. **Dynamic column-name interpolation in query builders** — `lib/db/queries/listings.ts` (`buildUpdate`), `lib/db/queries/agents.ts:93`, `lib/db/queries/agencies.ts:46` interpolate object keys into SQL. Routes currently mitigate via the `WRITABLE_FIELDS` allowlist (`app/api/listings/[id]/route.ts:47`), but the helpers are unsafe if ever called with raw input. Move the allowlist *into* the query helpers so safety doesn't depend on every caller.

### High
3. **Rate limiting on auth endpoints** — `/api/auth/register` and credentials login have none (the KV limiter exists but is only used for leads/uploads, and silently disables when `KV_URL` is unset). Add KV-backed limits on register, login, and the AI endpoints (`/api/generate`, `/api/import-listing` — these spend Anthropic tokens).
4. **Unify admin authorization** — some routes check `session.user.email === SUPER_ADMIN_EMAIL`, others check `role === 'admin'`. Pick one model (role-based, set server-side in the JWT callback), wrap it in a single `requireAdmin()` helper, and audit all `/api/admin/*` routes against it. Also harden the JWT `update` trigger in `auth.ts:82-88` — it currently lets the client set `userType`/`agencyId`/`role` via session update; re-derive these from the DB instead of trusting client input.
5. **Anonymous listing modification** — `app/api/listings/[id]/route.ts:13-20` lets anyone PATCH any listing where `agency_id` and `user_id` are null. Bind anonymous listings to a creator secret (cookie or the project code) instead of leaving them world-writable.

### Medium
6. **Security headers** — add CSP, `X-Frame-Options`/`frame-ancestors`, `X-Content-Type-Options`, `Referrer-Policy`, HSTS via `headers()` in `next.config.ts` (or in `proxy.ts`).
7. **Dependency vulnerabilities** — `npm audit` reports SMTP-injection advisories in nodemailer 7.x and a transitive PostCSS issue. Upgrade nodemailer to v8 and re-run audit; add `npm audit` to CI (Phase 3).
8. **Timing-safe secret comparison** — `app/api/admin/setup-db/route.ts:8` compares the setup secret with `!==`; use `crypto.timingSafeEqual`. Better: disable/remove this endpoint entirely once setup is done (it can recreate schema in production).
9. **Input validation at the API boundary** — routes consume `req.json()` casts directly. Introduce Zod schemas per route (start with listings, leads, register, broker-setup); this also fixes the `as unknown as Record<...>` casts flagged in QA.
10. **SSRF guard on listing import** — validate/allowlist the URL host in `/api/import-listing` before fetching, and block private IP ranges.

### Low
11. Centralize `ROOT_DOMAIN`/origin config (hardcoded fallback in `app/api/leads/route.ts:81` and elsewhere).
12. Audit logging for admin actions and failed logins (simple `security_events` table is enough to start).

---

## Phase 2 — UX/UI upgrade

### High impact
1. **Stop swallowing errors in the client.** Add a shared toast/notification component and use it everywhere errors currently vanish: image upload and street autocomplete (`components/builder/Step4.tsx:65,124`, `Step1.tsx:165`), listing status change (`app/dashboard/_listing-card.tsx:44`), leads fetch with no `.catch()` → infinite skeleton (`app/dashboard/leads/page.tsx:44`).
2. **Unsaved-changes protection in the builder** — add a `beforeunload` warning when there are changes newer than the last auto-save, and confirm before "back from step 1 to welcome" which discards data (`app/builder/_builder-client.tsx:454`).
3. **Replace native `confirm()`/`alert()` with a styled modal** (dashboard listing card, team page, admin discount codes) — consistent, brandable, screen-reader friendly.
4. **Accessibility pass on forms** — associate every input with a label (`htmlFor`/`id` missing across Step1–Step8), `aria-label` on the gallery prev/next buttons in `_preview-content.tsx:147`, `role="switch"`/`aria-checked` on all custom toggles, Escape-to-close + keyboard access for the tooltip backdrop div in `Step9.tsx:246`.

### Medium
5. **Inline validation feedback** — real-time field errors (red border + message) instead of warnings that appear only after submit; mark all required fields consistently with the existing `<Required />` component; add a "no results" state to the city/street combobox.
6. **Clearer async feedback** — spinner + text on the photo-enhance button (currently just `...`), distinguish save-failure causes in the builder status badge ("network" vs "server"), retry affordance on the register form.
7. **RTL consistency** — standardize `dir="ltr"` on all phone/URL/email inputs, replace physical CSS (`text-right`, `ml-*`) with logical properties (`text-start`, `ms-*`), fix the `dir="ltr"` wrapper around RTL content in `_preview-content.tsx:484`.
8. **Design-system primitives** — extract shared `Button`, `Input`, `Modal`, `Toast` components (button sizing/disabled styles currently differ page to page); this is also the prerequisite for items 1 and 3.

### Low
9. Step labels in the wizard progress bar ("שלב 3: תיאור הנכס" instead of just "3/9"); clearer wording for the welcome screen skip/back; check button-row overflow on <360px screens in the listing card.

---

## Phase 3 — General QA & engineering foundation

### Foundation (enables everything else)
1. **CI pipeline** — GitHub Actions running `tsc --noEmit`, `eslint`, `next build`, and `npm audit` on every PR. No `.github/` exists today; this is the single highest-leverage QA change.
2. **Test infrastructure** — Vitest + React Testing Library. Zero tests today. Priority order: (a) unit tests for the auth/role logic and the `WRITABLE_FIELDS` allowlist, (b) API route tests for listings/leads/register, (c) a Playwright smoke test of the 9-step builder happy path.
3. **One source of truth for the schema** — the schema lives in both `lib/db/schema.sql` and inline in `app/api/admin/setup-db/route.ts` (drift risk), and migration files in `lib/db/migrations/` are never applied by it. Wire `scripts/db-migrate.ts` to run all migrations in order, make the setup route delegate to it (or delete the route), and stop editing two copies.

### Robustness
4. **Catch fire-and-forget promises** — lead-notification email chain in `app/api/leads/route.ts:76-90` and `void fetch()` calls in Step9/builder swallow failures with no logging.
5. **Standardize API error shape** — one `{ error: string }` contract + a small `apiError()` helper; log full errors server-side, return generic messages to clients. Replace stray `console.info/log` (11 occurrences) with a minimal structured logger.
6. **Env validation at boot** — a `lib/env.ts` that asserts required vars (DB, NEXTAUTH_SECRET, Stripe, Anthropic) at startup instead of `?? ''` fallbacks failing silently at request time (`auth.ts:13-14`).
7. **Transactions for multi-step writes** (e.g., agency + agent creation during registration/broker setup).

### Maintainability & performance
8. **Split the giant components** — `_preview-content.tsx` (767 lines), `_builder-client.tsx` (512), Step9 (443), Step4 (434): extract gallery/hero/lead-form, builder state hook, and upload logic into separate modules so they're testable.
9. **Pagination** on listings/leads endpoints before data grows.
10. **`next/image`** for gallery/property photos (several `eslint-disable @next/next/no-img-element` today) — per the Next 16 docs in `node_modules/next/dist/docs/` for current API.
11. Make Anthropic model IDs env-configurable with the current defaults.
12. Document required vs optional env vars in `.env.example`/README.

---

## Suggested execution order

| Sprint | Contents |
|---|---|
| 1 | Phase 1 criticals (#1–2) + CI pipeline (Phase 3 #1) + security headers |
| 2 | Auth rate limiting, admin-auth unification, anonymous-listing fix, Zod on the riskiest routes |
| 3 | Toast system + error surfacing, unsaved-changes guard, confirm-modal, schema/migrations consolidation |
| 4 | Accessibility + RTL pass, test suite buildout, env validation, error-shape standardization |
| 5 | Component splitting, pagination, next/image, design-system primitives, remaining low-priority items |

Sprints 1–2 close the exploitable holes; 3 fixes the most user-visible friction; 4–5 pay down the engineering debt that makes everything else slow.
