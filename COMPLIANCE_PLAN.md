# Legal Compliance Review & Implementation Plan
### נגישות · דיוור · פרטיות — כל הפרויקטים

**Date:** 2026-07-14
**Source:** "הצ'קליסט המשפטי לאתר — 3 חוקים שכל אתר עסקי בישראל חייב לעמוד בהם" (Brain by Eden Bibas)
**Scope:** All repos under `hadarsap1`. Five repos were reviewed in depth this session; the rest are classified below and queued for a follow-up pass.

> ⚠️ This is an engineering gap-analysis against the checklist, not legal advice. The checklist itself recommends a lawyer / accessibility expert for final sign-off.

---

## 1. The checklist (digest)

**01 נגישות** — תקן ישראלי 5568 (WCAG 2.0 AA). Applies to any business providing service online. Exposure: up to ₪50,000 per violation without proof of damage.
- [ ] עמוד הצהרת נגישות
- [ ] רכז/ת נגישות עם פרטים (שם + טלפון או מייל — קשר אנושי, לא רק טופס)
- [ ] רכיב נגישות באתר (הגדלת טקסט, ניגודיות, עצירת אנימציות) — **הרכיב לבדו לא מספיק, האתר חייב להיות נגיש גם בקוד**
- [ ] טקסט חלופי (alt) לתמונות
- [ ] ניגודיות צבעים תקינה (4.5:1 מינימום)
- [ ] ניווט מלא במקלדת (פוקוס נראה, Tab לכל כפתור/קישור/שדה)

**02 דיוור** — חוק הספאם (תיקון 40 לחוק התקשורת). Applies to anyone sending marketing emails / SMS / WhatsApp. Exposure: up to ₪1,000 per message without proof of damage.
- [ ] הסכמה נפרדת לדיוור (צ'קבוקס ייעודי, לא מובלע בתנאי שימוש)
- [ ] צ'קבוקס לא מסומן מראש
- [ ] תיעוד ההסכמה (מתי ואיך; שמירת תאריך ומקור לכל נרשם)
- [ ] אפשרות הסרה בכל דיוור (טיפול תוך 3 ימי עסקים)
- [ ] זיהוי שולח ברור (שם העסק ודרך יצירת קשר בכל הודעה)
- [ ] סימון 'פרסומת'

**03 פרטיות** — חוק הגנת הפרטיות (תיקון 13, בתוקף מאוגוסט 2025). Applies to any site collecting personal data (name, email, phone). Exposure: significant administrative fines.
- [ ] עמוד מדיניות פרטיות (איזה מידע, למה, מה עושים איתו)
- [ ] אישור מדיניות לפני שליחה (צ'קבוקס לפני השארת פרטים בטופס)
- [ ] הודעת עוגיות (cookies) אם יש עוגיות/פיקסלים למעקב
- [ ] פירוט המידע הנאסף (שם, מייל, טלפון — במפורש)
- [ ] שמירה על אבטחת המידע

---

## 2. Project inventory & risk classification

### Reviewed in depth this session

| Project | What it is | Public? Collects data? | Risk | Verdict |
|---|---|---|---|---|
| **property-landing-builder** | SaaS — brokers build lead-capturing landing pages | Yes — public pages collect name/phone/email from strangers; platform collects broker accounts + billing | 🔴 **Highest** | Major gaps in all 3 areas — see §3 |
| **shachaf** | School onboarding platform (families + children data, chat, forms) | Yes — sensitive community data incl. kids' class info | 🟠 High (data), but | ✅ **Nearly compliant** — has PrivacyPage, TermsPage, AccessibilityPage, AccessibilityWidget, versioned consent with stored evidence (`consentVersion` + `consentAt`). Small verify-list in §4 |
| **shoham-hadarim** | Live single-property landing page (שוהם) with contact form → Resend email | Yes — collects name+phone+message | 🟠 Medium | No privacy policy, no consent line, no accessibility statement; form itself well-built (labels, honeypot, 18/19 alts) |
| **my-personal-web-site** | Personal portfolio (GitHub Pages) with inquiry form + custom Supabase analytics | Yes — collects email/company; behavioral analytics (scroll/click/salted IP hash) | 🟡 Low-Med | ✅ Privacy policy exists & covers analytics; form has aria-labels. Missing accessibility statement; verify Supabase `visits` table RLS (anon key is public in `analytics.js`) |
| **wine-tracker** | Expo/React Native mobile app + Firebase (auth, diary, analytics) | App, not a website — Israeli web checklist mostly N/A; app-store privacy rules apply | 🟡 Low | Has in-app privacy section; verify store-listing privacy policy URL + analytics consent |

### Not yet reviewed (session couldn't add them — approval required mid-run)

| Project | Guess by name/metadata | Likely applicability |
|---|---|---|
| homebound | Real-estate related site | Probably relevant — **review first in follow-up** |
| buffalo-kahanov | Business/brand page | Probably relevant |
| ella-eng / ellaeng | Business site (English teaching?) | Probably relevant if live & has contact form |
| pm-portfolio-builder | Portfolio tool | Low |
| arpalus-case-study | Case-study page | Low |
| recipes-app | Personal app | Low |
| ClearDay | Personal app | Low |
| cross-math, hazira-game | Games | Low (accessibility only if commercial) |
| SVMONEY | Private, unknown | Classify in follow-up |
| ralph-claude-code, nanobanana-mcp | Dev tools, not websites | **N/A — skip** |

---

## 3. property-landing-builder — detailed gap audit & fixes

This project is double-exposed: the **platform** must comply, and **every landing page it generates for brokers** must comply (the broker is the "business" on each generated page). Compliance must be built into the page template once — then all brokers' pages inherit it.

### 03 פרטיות — gaps (highest priority; law in effect since Aug 2025)

| Checklist item | Status | Fix |
|---|---|---|
| עמוד מדיניות פרטיות | ❌ Only `/terms` exists (with a small §5 on data) | New `app/privacy/page.tsx`: what is collected (broker accounts: name/email/password/Google ID, billing via provider; leads: name/phone/email; analytics events + session id; Vercel Analytics), purposes, retention, third parties (Vercel, DB host, email provider, Anthropic for AI text), rights, contact. Link from all footers + `/auth/register` + generated pages footer (`app/preview/_preview-content.tsx:582`) |
| אישור מדיניות לפני שליחה | ❌ Lead form (`_preview-content.tsx` `LeadCaptureForm`) has no checkbox | Add required checkbox "קראתי ואני מאשר/ת את מדיניות הפרטיות" + link, before the submit button; block submit unless checked. Same on broker registration form (`app/auth/register/_register-form.tsx`) |
| הודעת עוגיות | ❌ None (auth cookies, theme localStorage, Vercel Analytics, custom `/api/track`) | Small dismissible cookie/tracking notice component on platform pages; generated public pages currently set no cookies (track uses in-memory session id) — state this in the policy instead of a banner there |
| פירוט המידע הנאסף | ❌ Form says only "השאר פרטים ונחזור אליך" | One line under the form: "הפרטים שתמסור/י (שם, טלפון, מייל) יועברו ל[שם המתווך/סוכנות] לצורך חזרה אליך בלבד" |
| שמירה על אבטחת המידע | ⚠️ Partial | Verify: leads GET endpoints require auth + agency scoping; rate-limit `/api/leads` POST; document retention/deletion; run DB advisors |

### 01 נגישות — gaps

| Checklist item | Status | Fix |
|---|---|---|
| עמוד הצהרת נגישות | ❌ | New `app/accessibility/page.tsx` (platform) + auto-appended statement link on every generated page footer. Template per תקן 5568 |
| רכז/ת נגישות עם פרטים | ❌ | Name + email in the statement page. For generated pages: the broker's contact already appears; statement names platform coordinator |
| רכיב נגישות | ❌ | Small self-hosted widget component (font size ±, high contrast, stop animations, highlight links) embedded in generated pages + platform. Reuse approach from shachaf's `AccessibilityWidget.jsx` |
| טקסט חלופי לתמונות | ⚠️ `alt={img.name}` = file names like `IMG_1234.jpg` | Builder: add optional alt-text field per image (default: auto-description "תמונת הנכס — סלון" etc. or the listing title); fallback `alt={title}` |
| ניגודיות 4.5:1 | ⚠️ Suspect spots: `placeholder-white/60` on translucent inputs, `opacity-75`/`opacity-50` hero text, `mutedText` in dark-luxury theme | Contrast-audit all 5 themes (automated check with axe/pa11y), fix tokens |
| ניווט מלא במקלדת | ⚠️ Mostly OK (real buttons, aria-labels on carousel) | Add visible `:focus-visible` outline on all interactive elements; **auto-rotating gallery needs a pause button** (WCAG 2.2.2) and pause-on-hover/focus |

### 02 דיוור — gaps

Today the platform sends only transactional email (lead notification to broker, admin notify) — the spam law doesn't apply to those. But brokers will inevitably want to message the leads, and **today no lawful marketing consent is captured, so brokers may not legally send marketing to any collected lead.**

| Item | Fix |
|---|---|
| הסכמה נפרדת + לא מסומן מראש | Second, optional, **unchecked** checkbox on the lead form: "אני מאשר/ת קבלת עדכונים שיווקיים על נכסים מ[הסוכנות]" — separate from the privacy checkbox |
| תיעוד ההסכמה | Migration on `leads`: `marketing_consent boolean NOT NULL DEFAULT false`, `consent_at timestamp`, `consent_source text`, `policy_version text`. Show consent status in dashboard lead view |
| אפשרות הסרה / זיהוי שולח / סימון 'פרסומת' | Not needed until marketing sending exists; add to the template/docs of any future campaign feature; keep sender name + reply contact in current transactional mails (already fine) |

### Implementation order (this repo)

1. **P1 (privacy, ~1 day):** privacy policy page → lead-form consent checkbox + data-detail line → register-form consent → footer links.
2. **P2 (accessibility, ~1-2 days):** accessibility statement page → focus states + gallery pause → alt-text field in builder → contrast fixes → widget.
3. **P3 (mailing readiness, ~½ day):** leads consent migration + optional marketing checkbox + dashboard display.
4. **P4 (hardening, ~½ day):** cookie notice, rate limiting, security review of lead endpoints.

---

## 4. Other reviewed projects — fix lists

### shachaf (mostly ✅ — use as the reference implementation)
- Verify the accessibility statement lists a named coordinator + phone/email.
- Verify cookie/localStorage disclosure in PrivacyPage.
- If any broadcast messages to families are marketing-like — they're probably community-operational (exempt), but confirm unsubscribe/opt-out for non-essential notifications.
- Port its patterns outward: `consent.js` (versioned consent + stored evidence) and `AccessibilityWidget.jsx`.

### shoham-hadarim (~½ day)
- Add `privacy.html` (simple: name+phone+message collected, sent by email to owner for scheduling a visit, not shared, contact for deletion) + link under the form.
- Add consent checkbox (unchecked) before submit.
- Add the one missing `alt` (19 imgs / 18 alts).
- Add a short accessibility statement page + contact; run quick contrast/keyboard check.
- No mailing list → דיוור N/A.

### my-personal-web-site (~2 hours)
- Add accessibility statement page (EN is fine) + link in footer.
- Confirm privacy policy is linked near the inquiry form + add small consent line.
- **Security check:** `analytics.js` ships a public Supabase anon key that inserts to `visits` — confirm RLS allows INSERT-only for anon (no SELECT), otherwise visitor data is publicly readable. (Project `cbkuupjmemimbfuahizn`.)

### wine-tracker (~2 hours, app-store track)
- Ensure a hosted privacy policy URL (store listing requirement) matching in-app privacy section.
- Analytics: gate behind consent or document in policy.
- Israeli web checklist otherwise N/A (not a public website).

---

## 5. Cross-project rollout plan

**Phase 0 — Compliance kit (build once, in this repo):**
reusable Hebrew templates: privacy-policy template, accessibility-statement template (תקן 5568 wording), consent-checkbox snippet, cookie-notice snippet, accessibility widget. Adapted from shachaf where possible.

**Phase 1 — property-landing-builder** (P1→P4 above). Biggest exposure: real third-party users and their leads.

**Phase 2 — shoham-hadarim** (live page collecting leads today).

**Phase 3 — my-personal-web-site + shachaf verify-list.**

**Phase 4 — follow-up session:** add remaining repos (homebound, buffalo-kahanov, ella-eng, SVMONEY, others), classify: live business site with forms → apply kit; static/games/tools → accessibility-lite or skip.

**Phase 5 — recurring guard:** add a per-repo checklist file + optional CI check (axe/pa11y on key pages; grep-check that forms with personal-data inputs contain the consent component).

---

## 6. Suggested next actions

1. Approve this plan (or mark which phases to start).
2. Session implements Phase 0 + Phase 1 on this branch (`claude/project-checkin-planning-h07e5x`).
3. Fill in two human inputs needed for the templates: **accessibility coordinator name + contact**, and the **legal business name** to appear in policies.
4. Follow-up session with repo-add approvals to cover the unreviewed repos.
