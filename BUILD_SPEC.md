# IdolBooth V3.0 — Autonomous Build Specification

> **For the executing agent (Codex):** This file is your single source of truth. Execute tasks **in order**, in the working directory specified. Mark progress in the master checklist (Section 5) by editing this file. Commit after every checkpoint (`CKPT-x.y`). Stop and write a `BLOCKED.md` only if a hard block is hit; otherwise, keep going.

---

## 0. Mission Brief

Transform the existing IdolBooth website from a client-only PNG-overlay photobooth into a server-backed AI image-to-image creative tool for K-pop fans.

**Working directory:** `/Users/tm/idolbooth/idol-capture-magic` (existing Vite/React app — extend, do not delete)

**New code that needs a backend** lives in a sibling directory: `/Users/tm/idolbooth/server` (create it).

**Target deliverable:** A locally runnable app where:
1. User picks a member from a bias-centric IA (group → member).
2. Uploads a photo.
3. Picks a concept preset.
4. Receives an AI-composited output (photocard / selca / 4-cut strip).
5. Saves it to a personal Binder (auth-gated).
6. Can upgrade Free → Plus via Stripe test mode.

Everything must run with `npm run dev` in two terminals (frontend + backend) using only env vars listed in Section 3.

---

## 1. Invariants — Hard Rules That Cannot Be Violated

These constraints exist for legal, ethical, and safety reasons. Violating any of them is a **stop-and-report** condition.

1. **All AI-generated outputs MUST carry a watermark** ("idolbooth.com"), even in tier-Pro stub.
2. **Member reference images** in seed data MUST be `/public/placeholders/member_silhouette_{i}.png` placeholders, with a `TODO_LICENSED_ASSET: true` flag in DB. Never link to social media URLs of real persons.
3. **Block list in Section 12** must be enforced at API boundary. Any violation = 400 response.
4. **No production secrets in code.** All credentials via env vars (Section 3). If an env var is missing, fail loudly at startup, never silently.
5. **No destructive git commands** (`reset --hard`, `push --force`) without explicit human confirmation.
6. **Do not delete the existing `/photo-booth` and `/photo-with-idol` routes** — convert them into 301 redirects to the new routes for SEO preservation.

---

## 2. Pinned Tech Stack

Use **exactly these versions**. Do not "upgrade to latest."

### Frontend (`idol-capture-magic`)
- Existing: React 18.3, Vite 5.4, TypeScript 5.5, TailwindCSS 3.4, shadcn/ui, react-router 6.26
- Add:
  - `@tanstack/react-query` (already installed — start using)
  - `lucia@3.2.0` for client-side session helpers
  - `@stripe/stripe-js@4.7.0`
  - `zustand@4.5.5` for ephemeral generation flow state
  - `react-i18next@15.0.2` + `i18next@23.15.1` (English only for now, scaffold structure)

### Backend (`server/` — new)
- Runtime: **Node.js ≥ 20.10** (use `engines.node` in package.json)
- Framework: **Hono 4.6.3** (`hono`)
- DB: **better-sqlite3 11.3.0** + **drizzle-orm 0.34.0** (drizzle-kit 0.25.0 dev)
- Auth: **lucia 3.2.0** + **@lucia-auth/adapter-sqlite 3.0.1**
- Validation: **zod 3.23.8** (already in frontend, install in backend too)
- AI: **openai 4.67.3**
- Image processing: **sharp 0.33.5**
- Payments: **stripe 17.0.0**
- Dev runner: **tsx 4.19.1**

### Tooling
- Lint: ESLint flat config (existing for frontend; mirror for backend)
- Format: Prettier 3.3.3 (add to both)
- Tests: **vitest 2.1.2** (both projects)

---

## 3. Environment Variables

The user will populate these. Reference them by name. **At startup, validate presence with zod and throw if missing.**

### Backend `server/.env.example`
### Frontend `idol-capture-magic/.env.example`


Write `zod` validators (`server/src/config/env.ts`, `idol-capture-magic/src/lib/env.ts`) that parse `process.env` / `import.meta.env` and **fail at startup if required vars are missing**.

---

## 4. Repository Target Layout
/Users/tm/idolbooth/
├── BUILD_SPEC.md # this file
├── idol-capture-magic/ # frontend (existing, extended)
│ ├── src/
│ │ ├── api/ # ★ NEW — typed fetch wrappers for backend
│ │ ├── components/
│ │ │ ├── binder/ # ★ NEW — Binder grid, photocard tile
│ │ │ ├── generate/ # ★ NEW — 3-screen flow components
│ │ │ ├── group/ # ★ NEW — group + member hub components
│ │ │ ├── ui/ # shadcn (existing)
│ │ │ └── ... # existing
│ │ ├── contexts/
│ │ ├── hooks/
│ │ ├── i18n/ # ★ NEW — react-i18next setup
│ │ ├── lib/
│ │ ├── pages/
│ │ │ ├── group/ # ★ NEW — /g/:group, /g/:group/:member
│ │ │ ├── generate/ # ★ NEW — /selca, /photocard, /strip
│ │ │ ├── me/ # ★ NEW — /me, /me/binder, /me/settings
│ │ │ ├── campaign/ # ★ NEW — /c/:slug
│ │ │ ├── pricing/ # ★ NEW
│ │ │ ├── share/ # ★ NEW (renamed from SharePage)
│ │ │ └── legal/ # ★ NEW
│ │ ├── stores/ # ★ NEW — zustand
│ │ └── App.tsx # extended
│ └── public/
│ ├── placeholders/ # ★ NEW — silhouettes, generic art
│ └── samples/ # ★ NEW — concept sample outputs
└── server/ # ★ NEW — backend
├── src/
│ ├── index.ts # entry
│ ├── config/
│ │ ├── env.ts
│ │ └── safety.ts
│ ├── db/
│ │ ├── schema.ts # drizzle schema
│ │ ├── client.ts
│ │ └── seed/
│ │ ├── groups.json
│ │ ├── members.json
│ │ ├── concepts.json
│ │ └── seed.ts
│ ├── auth/
│ │ ├── lucia.ts
│ │ └── google.ts
│ ├── routes/
│ │ ├── auth.ts
│ │ ├── groups.ts
│ │ ├── members.ts
│ │ ├── concepts.ts
│ │ ├── campaigns.ts
│ │ ├── generate.ts # the AI endpoint
│ │ ├── binder.ts
│ │ ├── billing.ts
│ │ └── webhooks.ts
│ ├── services/
│ │ ├── generation/
│ │ │ ├── provider.ts # interface
│ │ │ ├── openai.ts
│ │ │ └── watermark.ts
│ │ ├── safety.ts
│ │ ├── storage.ts # local + R2-ready
│ │ ├── quota.ts
│ │ └── billing.ts
│ └── lib/
│ └── http.ts
├── data/ # SQLite file lives here (gitignored)
├── storage/ # local image storage (gitignored)
├── config/
│ └── blocklist.json
├── drizzle.config.ts
├── package.json
├── tsconfig.json
└── .env.example


---

## 5. Master Checklist

> **Codex: Edit this section in place to track progress. Replace `[ ]` with `[x]` after each task is verified done. Commit after every checkpoint.**

### Phase 0 — Bootstrap
- [x] T-0.1 Create `server/` directory with package.json
- [x] T-0.2 Pin all dependencies per Section 2
- [x] T-0.3 Set up TypeScript, ESLint, Prettier in `server/`
- [x] T-0.4 Configure `.env.example` files (frontend + backend) per Section 3
- [x] T-0.5 Add `.gitignore` entries for `data/`, `storage/`, `.env`
- [x] **CKPT-0** — `git add . && git commit -m "feat: bootstrap server scaffold"`

### Phase 1 — Backend Foundation
- [x] T-1.1 Implement `server/src/config/env.ts` with zod validation
- [x] T-1.2 Set up Hono app with CORS for `PUBLIC_APP_ORIGIN`
- [x] T-1.3 Define drizzle schema (Section 6.1)
- [x] T-1.4 Generate migrations and run them
- [x] T-1.5 Implement Lucia auth with Google OAuth
- [x] T-1.6 Implement `/auth/google`, `/auth/google/callback`, `/auth/logout`, `/auth/me`
- [x] T-1.7 Implement storage service (local filesystem now, R2-ready interface)
- [x] T-1.8 Implement quota service (per-user daily counter)
- [x] T-1.9 Implement safety service (Section 12 blocklist)
- [x] **CKPT-1** — backend boots, auth round-trip works

### Phase 2 — AI Generation Pipeline
- [x] T-2.1 Implement `GenerationProvider` interface
- [x] T-2.2 Implement OpenAI provider (`gpt-image-1` image-to-image)
- [x] T-2.3 Implement watermark service using sharp
- [x] T-2.4 Implement `POST /api/generate` endpoint (Section 6.2)
- [x] T-2.5 Implement `GET /api/generations/:id` for polling
- [x] T-2.6 Add input validation: file size <8MB, MIME types whitelist, NSFW heuristic stub
- [x] T-2.7 Write integration test: end-to-end generation with stub provider
- [x] **CKPT-2** — generation endpoint returns watermarked output

### Phase 3 — Auth & Payments
- [ ] T-3.1 Implement Stripe service (test mode)
- [ ] T-3.2 `POST /api/billing/checkout` creates Stripe Checkout session
- [ ] T-3.3 `POST /api/billing/portal` creates Stripe Customer Portal session
- [ ] T-3.4 Implement Stripe webhook handler (`/webhooks/stripe`)
- [ ] T-3.5 Sync subscription status to `users.plan`
- [ ] **CKPT-3** — Stripe test purchase upgrades plan

### Phase 4 — Domain APIs
- [ ] T-4.1 `GET /api/groups`, `GET /api/groups/:slug`
- [ ] T-4.2 `GET /api/members/:groupSlug/:memberSlug`
- [ ] T-4.3 `GET /api/concepts?memberId=&format=`
- [ ] T-4.4 `GET /api/campaigns/:slug`
- [ ] T-4.5 Binder CRUD: `GET/POST/DELETE /api/binder/items`
- [ ] T-4.6 `GET /api/binder/public/:handle`
- [ ] T-4.7 `GET /api/share/:generationId` (no auth)
- [ ] **CKPT-4** — all domain APIs documented, all return zod-validated JSON

### Phase 5 — Seed Data + Asset Generation
- [ ] T-5.1 Author `seed/groups.json` with 12 groups (Section 11)
- [ ] T-5.2 Author `seed/members.json` with members for each group (Section 11)
- [ ] T-5.3 Author `seed/concepts.json` with 24 concept presets (Section 11)
- [ ] T-5.4 Author `seed/campaigns.json` with 3 sample campaigns
- [ ] T-5.5 Implement `seed.ts` script
- [ ] T-5.6 Generate placeholder member silhouettes (Section 13.1)
- [ ] T-5.7 Generate concept sample outputs (Section 13.2)
- [ ] T-5.8 Generate group cover art (Section 13.3)
- [ ] T-5.9 Generate UI illustrations (logo, empty states) (Section 13.4)
- [ ] **CKPT-5** — `npm run seed` populates DB; `/public/placeholders/` and `/public/samples/` populated

### Phase 6 — Frontend: Foundation
- [ ] T-6.1 Set up `src/api/client.ts` with typed fetch wrappers
- [ ] T-6.2 Set up react-query providers (already mounted, configure)
- [ ] T-6.3 Set up react-i18next with English locale stub
- [ ] T-6.4 Implement `useAuth` hook → calls `/auth/me`
- [ ] T-6.5 Implement `useQuota` hook
- [ ] T-6.6 Add zustand store for generation flow state
- [ ] T-6.7 Update `App.tsx` routing per Section 7.1
- [ ] T-6.8 Add 301-style redirects for legacy routes (`/photo-booth` → `/strip`, `/photo-with-idol` → `/selca`)
- [ ] **CKPT-6** — all routes resolve, auth state visible

### Phase 7 — Frontend: Pages
- [ ] T-7.1 New homepage `/` per Section 7.2
- [ ] T-7.2 Group hub `/g/:groupSlug` per Section 7.3
- [ ] T-7.3 Member hub `/g/:groupSlug/:memberSlug` per Section 7.4
- [ ] T-7.4 Generation flow shared component (3-screen wizard) per Section 7.5
- [ ] T-7.5 `/selca` page (uses generation flow, format=selca)
- [ ] T-7.6 `/photocard` page (format=photocard, plus card-back editor)
- [ ] T-7.7 `/strip` page (format=strip, port webcam capture from existing code)
- [ ] T-7.8 Campaign page `/c/:slug` per Section 7.6
- [ ] T-7.9 `/calendar` page (simple list view of upcoming events)
- [ ] T-7.10 `/me` dashboard per Section 7.7
- [ ] T-7.11 `/me/binder` per Section 7.8
- [ ] T-7.12 `/binder/:handle` public binder
- [ ] T-7.13 `/share/:id` public share
- [ ] T-7.14 `/pricing` page per Section 7.9
- [ ] T-7.15 `/legal/safety` and `/legal/takedown` (placeholder copy)
- [ ] **CKPT-7** — all pages render, no broken links

### Phase 8 — Integration & Polish
- [ ] T-8.1 SEO: per-route `<title>` and meta description (extend existing `TitleUpdater`)
- [ ] T-8.2 Generate `sitemap.xml` including all `/g/*/*` and `/c/*` URLs (extend existing script)
- [ ] T-8.3 Add OpenGraph / Twitter card meta to `/share/:id`
- [ ] T-8.4 Wire watermark service into actual generation
- [ ] T-8.5 Add error boundaries to App and key pages
- [ ] T-8.6 Add loading skeletons for all async pages
- [ ] T-8.7 Configure Vite proxy in dev so `/api/*` → backend
- [ ] T-8.8 Run `npm run lint` and fix all errors in both projects
- [ ] T-8.9 Write `README.md` at repo root with setup instructions
- [ ] T-8.10 Smoke test full user journey (Section 14)
- [ ] **CKPT-8** — full E2E demo runs successfully

---

## 6. Backend Specifications

### 6.1 Drizzle Schema (`server/src/db/schema.ts`)

```ts
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),                       // cuid
  email: text('email').notNull().unique(),
  handle: text('handle').notNull().unique(),
  googleId: text('google_id').unique(),
  biasGroupId: text('bias_group_id'),
  biasMemberId: text('bias_member_id'),
  locale: text('locale').notNull().default('en'),
  plan: text('plan', { enum: ['free', 'plus', 'pro'] }).notNull().default('free'),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  planRenewsAt: integer('plan_renews_at'),           // unix
  dailyQuotaUsed: integer('daily_quota_used').notNull().default(0),
  dailyQuotaResetAt: integer('daily_quota_reset_at').notNull(),
  createdAt: integer('created_at').notNull(),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  expiresAt: integer('expires_at').notNull(),
});

export const groups = sqliteTable('groups', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),                       // EN
  nameKo: text('name_ko'),
  nameJa: text('name_ja'),
  agency: text('agency'),
  debutDate: text('debut_date'),                       // ISO
  themeColor: text('theme_color').notNull().default('#FFFFFF'),
  coverImage: text('cover_image'),                     // /public/...
  popularityRank: integer('popularity_rank').notNull().default(999),
});

export const members = sqliteTable('members', {
  id: text('id').primaryKey(),
  groupId: text('group_id').notNull().references(() => groups.id),
  slug: text('slug').notNull(),
  name: text('name').notNull(),
  nameKo: text('name_ko'),
  nameJa: text('name_ja'),
  position: text('position'),                          // "Main Vocalist" etc.
  birthday: text('birthday'),                          // MM-DD
  silhouetteImage: text('silhouette_image').notNull(), // placeholder
  todoLicensedAsset: integer('todo_licensed_asset', { mode: 'boolean' }).notNull().default(true),
  facts: text('facts'),                                // JSON string
});

export const concepts = sqliteTable('concepts', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  format: text('format', { enum: ['selca', 'photocard', 'strip', 'fancall'] }).notNull(),
  category: text('category'),                          // 'comeback' | 'daily' | 'birthday' | 'concert' | 'polaroid'
  campaignId: text('campaign_id'),                     // optional
  promptTemplate: text('prompt_template').notNull(),
  styleTokens: text('style_tokens').notNull(),         // JSON string
  sampleOutputUrl: text('sample_output_url').notNull(),
  premium: integer('premium', { mode: 'boolean' }).notNull().default(false),
});

export const campaigns = sqliteTable('campaigns', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  groupId: text('group_id').notNull().references(() => groups.id),
  title: text('title').notNull(),
  releaseDate: text('release_date').notNull(),
  status: text('status', { enum: ['upcoming', 'active', 'archived'] }).notNull(),
  conceptKeywords: text('concept_keywords').notNull(), // JSON array
  conceptPalette: text('concept_palette').notNull(),   // JSON array of hex
  heroImage: text('hero_image'),
  description: text('description'),
});

export const generations = sqliteTable('generations', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),  // nullable for anon first-try
  conceptId: text('concept_id').notNull().references(() => concepts.id),
  memberId: text('member_id').notNull().references(() => members.id),
  format: text('format').notNull(),
  status: text('status', { enum: ['queued', 'running', 'succeeded', 'failed'] }).notNull(),
  inputImageRef: text('input_image_ref'),
  outputImageRef: text('output_image_ref'),
  errorMessage: text('error_message'),
  cost: real('cost'),
  watermarkLevel: text('watermark_level').notNull(),   // 'visible' | 'small' | 'invisible'
  isPublic: integer('is_public', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at').notNull(),
});

export const binderItems = sqliteTable('binder_items', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  generationId: text('generation_id').notNull().references(() => generations.id),
  customCaption: text('custom_caption'),
  position: integer('position').notNull().default(0),
  addedAt: integer('added_at').notNull(),
});

6.2 Generation Endpoint Contract
POST /api/generate (multipart/form-data)

Fields:
photo: File, image/* MIME, max 8MB
conceptId: string
memberId: string
makePublic: boolean (optional, default false)
Auth: optional. If unauthenticated, userId is null but rate-limited by IP (max 1 generation per IP per day).
Process:
Validate inputs with zod.
Run safety filter on prompt template + member metadata (Section 12).
Check quota (or anon IP rate limit).
Create generations row with status=queued.
Synchronous in V2.0 (no queue): call provider.generate(), update row to running → succeeded/failed.
Upload output image to storage with watermark applied based on user plan.
Decrement quota.
Return JSON: { id, status, outputUrl, watermarkLevel, quotaRemaining }.
Errors:
400: validation / blocklist hit / unsupported format
402: quota exhausted (frontend triggers upsell)
422: provider rejected (NSFW, face detection failed, etc.)
500: unexpected
6.3 Provider Interface (server/src/services/generation/provider.ts)

export interface GenerationRequest {
  conceptPrompt: string;          // already-composed final prompt
  styleTokens: string[];
  inputImagePath: string;         // local path
  memberSilhouettePath: string;   // local path; placeholder for now
  outputFormat: 'png' | 'webp';
  size: '1024x1024' | '1024x1536' | '1536x1024';
}

export interface GenerationResult {
  imagePath: string;              // local path of output (pre-watermark)
  costUsd: number;
  providerJobId: string;
}

export interface GenerationProvider {
  name: string;
  generate(req: GenerationRequest): Promise<GenerationResult>;
  estimateCost(req: GenerationRequest): number;
}

6.4 OpenAI Provider Implementation Notes
Use openai.images.edit() with the user image as image and a mask if needed; or openai.images.generate() if image-to-image edit isn't suitable for the concept.
For V2.0, prefer images.generate with detailed prompt that references the user image being placed alongside a silhouette — do not attempt to generate real idol faces.
Cost estimation: gpt-image-1 is approximately $0.04 for 1024×1024 standard quality. Hardcode this estimate; revisit if pricing changes.
Failure modes to catch: rate limit (429), content_policy_violation (400), timeout (>60s).
Save raw output to STORAGE_BACKEND location, return path.
6.5 Watermark Service
Use sharp to composite a watermark PNG (/server/assets/watermark-{level}.png, generated in T-5.9) onto the output:

Plan	Watermark file	Position
free	watermark-visible.png	bottom-right, 12% width, 80% opacity
plus	watermark-small.png	bottom-right, 6% width, 50% opacity
pro	(none)	metadata-only EXIF tag XMP-idolbooth:Generated=true
7. Frontend Specifications
7.1 Routing (extend App.tsx)

/                         Index              (★ rebuild per 7.2)
/g/:groupSlug             GroupHub           (★ new, 7.3)
/g/:groupSlug/:memberSlug MemberHub          (★ new, 7.4)
/c/:slug                  CampaignPage       (★ new, 7.6)
/calendar                 CalendarPage       (★ new)
/selca                    SelcaPage          (★ new, uses GenerationFlow)
/photocard                PhotocardPage      (★ new)
/strip                    StripPage          (★ port from PhotoBooth)
/templates                TemplateGallery    (existing — adapt)
/templates/:category      TemplateCategoryPage (existing — adapt)
/me                       Dashboard          (★ new, 7.7)
/me/binder                MyBinder           (★ new, 7.8)
/me/settings              Settings           (★ new)
/binder/:handle           PublicBinder       (★ new)
/share/:id                SharePage          (existing — extend)
/pricing                  Pricing            (★ new, 7.9)
/legal/safety             SafetyPage         (★ new)
/legal/takedown           TakedownPage       (★ new)
/privacy                  PrivacyPolicy      (existing)
/terms                    TermsOfService     (existing)
/photo-booth              <Navigate to="/strip" replace />
/photo-with-idol          <Navigate to="/selca" replace />
*                         NotFound

7.2 Homepage /
Above the fold (60vh):

Left half: H1 = "Free K-pop AI Selca, Photocard & Photobooth" (mobile: stacked above)
Sub-headline: "Make a selca with your bias in 30 seconds. No download. Free forever."
Primary CTA: "Pick your bias →" (scrolls to bias picker)
Right half: 3-image rotating carousel (using sample outputs from T-5.7), 3s interval, fade transition.
Section 2 — Format tiles (3 cards):

Card 1: "Selca with idol" → /selca
Card 2: "AI Photocard" → /photocard
Card 3: "4-cut Photo Strip" → /strip
Each card: title + 1 sample image + 1-line description + "Try free →" button
Section 3 — Bias picker:

Heading "Pick your bias"
Horizontal scrollable group rail (load /api/groups?limit=12&sort=popularity)
Click group → expand member tiles below
Click member → navigate to /g/:groupSlug/:memberSlug
Section 4 — This week:

Heading "This week in K-pop"
Cards from /api/campaigns?status=upcoming,active&limit=6
Member birthday cards (from /api/calendar/birthdays?withinDays=7)
Section 5 — Recent fan creations:

Grid of 12 latest isPublic=true generations
Each tile shows output (with watermark) + "Make yours →" hover
Footer:

Links: Pricing, Safety, Takedown, Privacy, Terms
Language switcher (English only for now, but render the dropdown)
7.3 Group Hub /g/:groupSlug
Hero: group cover image + group name + agency + debut year
Member tiles grid (responsive 2/3/5 columns)
Active campaign banner if any
Recent generations across all members
7.4 Member Hub /g/:groupSlug/:memberSlug ★ critical page
Hero with theme color gradient bg
H1: "Take an AI Selca with {member.name} ({group.name}) — Free"
Member metadata strip: position, birthday with countdown, debut anniversary
4 quick-action large buttons (responsive — stack on mobile):
"Selca" → /selca?memberId=...
"Photocard" → /photocard?memberId=...
"Strip" → /strip?memberId=...
"Fancall 🔒 Plus" (disabled in V2.0, tooltip: "Coming soon")
Concept gallery: filtered to this member, 12-16 cards
Each card: sample image + concept name + premium badge if applicable
Filter chips: "All / Comeback / Daily / Birthday / Concert / Polaroid"
Sticky bottom CTA on mobile: "Upload your photo →"
SEO content section: 300-500 words auto-rendered from member.facts
Recent generations using this member
7.5 Generation Flow (3-screen wizard)
Reusable component <GenerationFlow format={format} memberId={...} conceptId={...?} />.

Screen 1 — Choose Concept (skip if conceptId already provided):

Top bar: member chip + "Change member" link
Concept grid; tap to select
Bottom CTA "Continue →"
Screen 2 — Provide Photo:

Drag-drop zone + "Use webcam" button (port existing WebcamCapture component)
After upload: circular preview + face detection result (use face-api.js from a CDN or simple heuristic — for V2.0, accept any image-like input and let server handle)
Privacy line: "Photo is processed only to generate your output. We don't train AI on it." → links to /legal/safety
CTA: "Generate ✨ ({n}/{total} left today)" — disabled if quota exhausted
Screen 3 — Result:

Loading state: skeleton with concept's primary color, status text "Composing... ~12s"
On success: full-size output, 4 buttons row:
"Save to Binder" → POST /api/binder/items
"Regenerate" → restart flow Screen 2 (resubmit, costs 1 quota)
"Try variation" → resubmit with variation=true query
"Share" → opens menu (Copy link / IG Story / X)
Quota indicator
On quota exhausted: upsell card replaces buttons
State management: zustand store in src/stores/generationFlow.ts.

7.6 Campaign Page /c/:slug
Hero with conceptPalette gradient + heroImage
H1: "{group} {title} Concept Photo Maker"
Description (from DB)
Countdown to releaseDate if upcoming, "Now active" badge if active
6-8 concept cards filtered by campaignId
Member selector (radio chips of all group members)
Internal links to each /g/groupSlug/memberSlug
SEO content paragraph (auto-rendered from description)
7.7 Dashboard /me
Greeting + handle
Daily quota progress bar
"Today's bias card" auto-generated card if user has bias set
Upcoming events for bias (next 30 days)
Recent 6 generations strip → links to /me/binder
Plan upgrade card (if free)
7.8 My Binder /me/binder
3×3 or 3×4 grid (toggleable)
Each tile: photocard-shaped (54:86 aspect)
Sort dropdown: by date / by member / by format
Filter chips: format / member
Bulk-select mode: export PDF (stub for V2.0 — show "Coming in Pro" toast)
Per-tile: tap → fullscreen modal with re-share / re-generate / edit caption / delete
"Make this binder public" toggle → publishes to /binder/:handle
7.9 Pricing /pricing
3-column comparison table:

Feature	Free	Plus $4.99/mo	Pro $9.99/mo
Daily generations	3	30	200
Watermark	Visible	Small	None
Photocard double-side	✓	✓	✓
HD download	—	✓	✓
Binder unlimited	✓	✓	✓
Print PDF	—	—	✓
Premium concepts	—	✓	✓
Fancall	—	—	✓
CTAs use Stripe Checkout for Plus and Pro. Annual toggle gives 2 months free.

8. Existing Code to Port / Adapt

The existing app contains useful logic. Port — do not delete until ports are verified:

Existing	Action	Destination
src/components/WebcamCapture.tsx	Reuse as-is in Screen 2 of generation flow	src/components/generate/PhotoCapture.tsx (wrap)
src/components/PhotoStrip.tsx	Port the generatePhotoStrip canvas logic	src/components/generate/StripCompositor.tsx
src/lib/imageProcessing.ts	Keep	unchanged
src/contexts/PhotoStripContext.tsx	Deprecate gradually — types stay, but provider role moves to backend + zustand. For V2.0, keep the provider mounted to avoid breaking PhotoStrip page.	
src/data/templates.ts	Migrate template data → concepts table seed data	n/a
src/pages/PhotoStrip.tsx	Keep functional, but refactor to use new /strip route	rename to pages/generate/StripPage.tsx
src/pages/PhotoBooth.tsx	Keep functional during transition; route /photo-booth redirects to /strip once StripPage is verified	eventually delete
9. Frontend App.tsx — Updated TitleUpdater
Extend the existing TitleUpdater with cases for new routes. Use this template:

const ROUTE_META: Array<{ match: RegExp; title: string; description: string }> = [
  { match: /^\/$/, title: '...', description: '...' },
  { match: /^\/g\/[^/]+\/[^/]+$/, title: 'AI Photo with {member}', description: '...' },
  // ...
];
For dynamic routes (member, campaign), fetch from /api/... and update <title> after data loads. Use react-helmet-async if simpler — install version 2.0.5.

10. Sitemap
Update scripts/generate-sitemap.js to:

Read seed data JSON files.
Emit one <url> per group, member, concept, and campaign.
Set priority higher for member hubs (0.8) than templates (0.5).
Output to public/sitemap.xml.
11. Seed Data Specifications
11.1 Groups (seed/groups.json) — author 12 entries
Use the following groups (popularity rank in order):

[
  { "slug": "newjeans",     "name": "NewJeans",     "agency": "ADOR",      "debutDate": "2022-07-22", "themeColor": "#A8C8E5", "popularityRank": 1 },
  { "slug": "ive",          "name": "IVE",          "agency": "Starship",  "debutDate": "2021-12-01", "themeColor": "#7B68EE", "popularityRank": 2 },
  { "slug": "aespa",        "name": "aespa",        "agency": "SM",        "debutDate": "2020-11-17", "themeColor": "#FF1493", "popularityRank": 3 },
  { "slug": "le-sserafim",  "name": "LE SSERAFIM",  "agency": "Source",    "debutDate": "2022-05-02", "themeColor": "#1E1E1E", "popularityRank": 4 },
  { "slug": "twice",        "name": "TWICE",        "agency": "JYP",       "debutDate": "2015-10-20", "themeColor": "#FF6F61", "popularityRank": 5 },
  { "slug": "blackpink",    "name": "BLACKPINK",    "agency": "YG",        "debutDate": "2016-08-08", "themeColor": "#FF69B4", "popularityRank": 6 },
  { "slug": "bts",          "name": "BTS",          "agency": "BIGHIT",    "debutDate": "2013-06-13", "themeColor": "#7B0091", "popularityRank": 7 },
  { "slug": "stray-kids",   "name": "Stray Kids",   "agency": "JYP",       "debutDate": "2018-03-25", "themeColor": "#000000", "popularityRank": 8 },
  { "slug": "seventeen",    "name": "SEVENTEEN",    "agency": "PLEDIS",    "debutDate": "2015-05-26", "themeColor": "#FFD700", "popularityRank": 9 },
  { "slug": "enhypen",      "name": "ENHYPEN",      "agency": "BELIFT",    "debutDate": "2020-11-30", "themeColor": "#9B0000", "popularityRank": 10 },
  { "slug": "txt",          "name": "TXT",          "agency": "BIGHIT",    "debutDate": "2019-03-04", "themeColor": "#5F9EA0", "popularityRank": 11 },
  { "slug": "itzy",         "name": "ITZY",         "agency": "JYP",       "debutDate": "2019-02-12", "themeColor": "#FFA500", "popularityRank": 12 }
]
For each, generate id as cuid(), coverImage as /placeholders/group_{slug}.png (will be created in T-5.8).

11.2 Members (seed/members.json)
For each group above, add member entries with publicly known stage names only (no birth dates, no addresses, no real photos). Example structure:

{
  "groupSlug": "newjeans",
  "members": [
    { "slug": "minji",    "name": "Minji",    "position": "Leader, Vocalist",   "birthday": "05-07" },
    { "slug": "hanni",    "name": "Hanni",    "position": "Vocalist",            "birthday": "10-06" },
    { "slug": "danielle", "name": "Danielle", "position": "Vocalist",            "birthday": "04-11" },
    { "slug": "haerin",   "name": "Haerin",   "position": "Vocalist",            "birthday": "05-15" },
    { "slug": "hyein",    "name": "Hyein",    "position": "Vocalist, Maknae",    "birthday": "04-21" }
  ]
}
Author this JSON for all 12 groups. For each member, set silhouetteImage = "/placeholders/silhouette_{1-6}.png" rotating among 6 generic silhouettes (created in T-5.6). todoLicensedAsset = true. facts is a JSON string with at least { "position": "...", "groupRole": "..." } — keep facts minimal and uncontroversial.

11.3 Concepts (seed/concepts.json) — 24 entries
Cover 4 formats × 6 categories. Concept naming format: {Aesthetic} {Format}. Example:

{
  "slug": "polaroid-selca",
  "name": "Polaroid Film Selca",
  "format": "selca",
  "category": "polaroid",
  "promptTemplate": "A vintage polaroid photograph showing two people side-by-side at golden hour, soft film grain, warm tones, 1990s aesthetic, slightly faded edges, casual smile, the user (from reference image) on the left, an anonymized stylized companion silhouette on the right with K-pop concept styling. Square crop. Photorealistic but clearly polaroid-style.",
  "styleTokens": ["polaroid", "film grain", "warm", "vintage"],
  "sampleOutputUrl": "/samples/polaroid-selca.png",
  "premium": false
}
Critical rules for prompt templates:

NEVER include real idol names in prompt template.
ALWAYS include "anonymized stylized companion" or "silhouette figure" instead of real persons.
ALWAYS include style anchors (polaroid, sticker, illustration, painting) to keep output stylized.
Define 24 concepts spanning:

6 selca concepts (polaroid, han-river-walk, cafe-window, cherry-blossom, neon-night, bedroom-mirror)
6 photocard concepts (holo-frame, season-greeting, fanmeet-ticket, world-tour-pc, plain-pc, glitter-pc)
6 strip concepts (life4cuts-classic, pastel-frame, retro-photobooth, monochrome, neon-sign, paper-tape)
6 fancall concepts (set premium: true — these only show locked in V2.0)
11.4 Campaigns (seed/campaigns.json) — 3 sample entries
Create 3 fictional campaigns:

[
  {
    "slug": "newjeans-supernatural",
    "groupSlug": "newjeans",
    "title": "Supernatural Concept",
    "releaseDate": "2026-06-15",
    "status": "active",
    "conceptKeywords": ["Y2K", "metallic", "futuristic", "soft-focus"],
    "conceptPalette": ["#A8C8E5", "#FFFFFF", "#C0C0C0", "#000033"],
    "description": "Try the Supernatural concept aesthetic — Y2K metallic with soft-focus."
  },
  {
    "slug": "ive-i-am",
    "groupSlug": "ive",
    "title": "I AM Concept",
    "releaseDate": "2026-04-10",
    "status": "archived",
    "conceptKeywords": ["regal", "powerful", "white", "classical"],
    "conceptPalette": ["#FFFFFF", "#7B68EE", "#FFD700"],
    "description": "Royal aesthetic — white regalia and classical lighting."
  },
  {
    "slug": "aespa-whiplash",
    "groupSlug": "aespa",
    "title": "Whiplash Concept",
    "releaseDate": "2026-10-21",
    "status": "upcoming",
    "conceptKeywords": ["cyberpunk", "neon", "metallic", "edgy"],
    "conceptPalette": ["#FF1493", "#00FFFF", "#1A1A2E"],
    "description": "Cyberpunk concept with neon edges."
  }
]
12. Safety: Block Lists & Filters (server/config/blocklist.json)
Author this JSON:

{
  "promptBlocklist": [
    "boyfriend", "girlfriend", "kiss", "kissing", "dating", "date with",
    "in bed", "bedroom intimate", "naked", "nude", "topless", "undressed",
    "sexy", "erotic", "nsfw",
    "남자친구", "여자친구", "키스", "데이트", "남친", "여친",
    "彼氏", "彼女", "キス", "デート",
    "男朋友", "女朋友", "亲吻", "约会"
  ],
  "memberNameAllowlist": "all from members table",
  "rejectIfMinorAge": true
}
The safety service (server/src/services/safety.ts) implements:

export function checkPrompt(text: string): { ok: boolean; reason?: string }
export function checkConcept(concept: Concept, member: Member): { ok: boolean; reason?: string }
checkPrompt is case-insensitive, normalizes whitespace, checks for any blocklist substring.

If a check fails, the API returns 400 with { error: 'safety_block', reason: '...' } — never echo the offending phrase back in the response.

13. Image Asset Generation Tasks
Codex must generate the following images using the OpenAI image API. For ALL prompts, never reference real persons by name.

For each task: call openai.images.generate({ model: 'gpt-image-1', prompt: <prompt>, size: <size>, n: 1 }), save the result to the specified path. Use node script in server/scripts/generate-assets.ts.

13.1 Member silhouettes (T-5.6) — 6 images
Save to idol-capture-magic/public/placeholders/silhouette_{1..6}.png, size 1024x1024.

Prompts (one per silhouette):

"Minimalist vector silhouette portrait of a generic young person with a long-hair K-pop aesthetic, plain pastel pink background, no facial features visible, side profile, flat design"
"Minimalist vector silhouette portrait of a generic young person with short bob hair, plain pastel blue background, no facial features visible, three-quarter angle, flat design"
"Minimalist vector silhouette portrait of a generic young person with curly mid-length hair, plain pastel yellow background, no facial features visible, front view shadow only, flat design"
"Minimalist vector silhouette portrait of a generic young person wearing a beanie, plain pastel green background, no facial features visible, side profile, flat design"
"Minimalist vector silhouette portrait of a generic young person with straight long hair, plain pastel lavender background, no facial features visible, three-quarter angle, flat design"
"Minimalist vector silhouette portrait of a generic young person with a ponytail, plain pastel peach background, no facial features visible, front view shadow, flat design"
13.2 Concept sample outputs (T-5.7) — 24 images
For each concept in seed/concepts.json, save to public/samples/{conceptSlug}.png. Size depends on format:

selca → 1024x1024
photocard → 1024x1536
strip → 1024x1536
fancall → 1536x1024
Use the concept's promptTemplate directly, but substitute the user-image reference language with: "two stylized illustrated figures (no real persons), one in K-pop fashion, one in casual fan attire, faces shown as soft abstract gradients without distinct features."

Each prompt should produce a clearly stylized, non-photorealistic sample.

13.3 Group covers (T-5.8) — 12 images
Save to idol-capture-magic/public/placeholders/group_{slug}.png, size 1536x1024.

Prompt template: "Abstract aesthetic banner for a K-pop fan tool, color palette dominated by {hex1} and {hex2}, no text, no human figures, modern minimal design with bokeh and light flares" — substitute the group's themeColor as hex1 and a complementary color as hex2.

13.4 UI illustrations (T-5.9) — 5 images
File	Size	Prompt
public/brand/logo.png	512x512	"Minimal flat logo for 'idolbooth' — letter mark 'IB' inside a rounded square, soft pastel pink and white, modern, clean, no text other than letters"
public/illustrations/empty-binder.png	1024x1024	"Cute minimal illustration of an empty photo binder with three blank polaroid card slots, pastel pink and cream tones, line-art style with subtle shadow"
public/illustrations/upload-photo.png	1024x1024	"Minimal line-art illustration of a smartphone with a photo upload arrow, pastel blue background, friendly and inviting"
server/assets/watermark-visible.png	512x128	"Watermark text 'idolbooth.com · AI generated' in white sans-serif on transparent background"
server/assets/watermark-small.png	256x64	"Watermark text 'idolbooth.com' in white sans-serif on transparent background"
For watermark images, generate with transparent background (use background: 'transparent' parameter if supported; otherwise post-process with sharp to remove white background).

14. Smoke Test Script (T-8.10)
Create scripts/smoke-test.sh at repo root that performs:

#!/usr/bin/env bash
set -euo pipefail

# 1. Backend health
curl -fsS http://localhost:8787/health | grep -q '"ok":true'

# 2. Public APIs
curl -fsS http://localhost:8787/api/groups | jq -e '.[] | select(.slug=="newjeans")' > /dev/null
curl -fsS http://localhost:8787/api/members/newjeans/haerin | jq -e '.slug=="haerin"' > /dev/null
curl -fsS http://localhost:8787/api/concepts | jq -e 'length >= 24' > /dev/null

# 3. Frontend renders key pages (status 200)
for path in / /g/newjeans /g/newjeans/haerin /selca /pricing /c/newjeans-supernatural; do
  curl -fsS -o /dev/null -w "%{http_code}\n" "http://localhost:8080$path" | grep -q 200
done

echo "✓ smoke test passed"
This must pass before declaring CKPT-8 done.

15. Commit & Checkpoint Discipline
After every checkpoint (CKPT-x):

Run npm run lint in both projects. Fix any errors.
Run npm run build in both projects. Fix any errors.
Run smoke test if applicable to the phase.
git add -A && git commit -m "feat(ckpt-N): <one-line summary>"
Update Section 5 master checklist (this file) — mark items complete.
Continue to next phase.
If any step fails:

Try one fix attempt.
If still failing, write BLOCKED.md at repo root with: phase, task, error message, attempted fixes. Do not proceed.
16. Out-of-Scope for V2.0 (Do Not Build)
These are explicitly deferred to V2.5+:

Multi-language UI beyond English (scaffold i18n only)
Push notifications / email subscriptions
Real Stripe production keys (test mode only)
Print PDF generation (button stub with toast "Coming in Pro")
Fancall mode (premium tier shows but feature stubbed with "Coming soon")
Admin UI (use CLI seed scripts instead)
Real comeback engine ops workflow
C2PA metadata for Pro watermarks (stub only)
WebSocket / SSE for generation progress (use polling)
Print-at-home crop marks
Public binder remix
Fan-day reminders
Custom prompt input for Pro tier
17. Final Acceptance Criteria
V2.0 is complete when all of the following are true:

✅ Master checklist (Section 5) is fully [x].
✅ npm run dev works in both idol-capture-magic and server simultaneously.
✅ Smoke test script passes.
✅ A user can: visit /, click NewJeans → Haerin, click "Selca", upload any photo from idol-capture-magic/public/placeholders/, get a watermarked AI output, log in via Google OAuth, save to Binder, view in /me/binder.
✅ Stripe test-mode subscription upgrades user.plan and reflects in /me.
✅ All legacy URLs (/photo-booth, /photo-with-idol) redirect correctly.
✅ BLOCKED.md does not exist.
18. Notes for Human Reviewer (post-completion)
After Codex completes, the human reviewer should:

Replace placeholder member silhouettes with licensed assets. Search codebase for todoLicensedAsset: true.
Review safety blocklist for completeness in target launch markets.
Set up real Stripe products and rotate price IDs.
Configure Google OAuth consent screen in production.
Migrate from local SQLite to managed Postgres / D1 for production.
Migrate from local filesystem storage to R2 / S3 for production.
Replace placeholder marketing copy (search for [HUMAN_REVIEW] markers).
Run a legal review on safety policy, terms, and privacy pages.
END OF SPEC

---
