# IdolBooth Optimization Plan - 2026-06-05

## Data Sources

- Google Search Console export: `goole-search-console-data/idolbooth.com-Performance-on-Search-2026-06-05`, web search, last 3 months, covering 2026-03-02 through 2026-06-01.
- Production D1 read-only aggregate queries via Wrangler, queried on 2026-06-05 local time.
- Current codebase inspection for SEO routing, generation flow, billing, and analytics instrumentation.

No user-level rows, emails, image refs, or payment identifiers were used in this plan.

The GSC calculations are now reproducible from the local export:

```sh
cd /Users/tm/idolbooth/idol-capture-magic
npm run analyze:gsc
```

Pass a specific export folder to compare a later pull:

```sh
npm run analyze:gsc -- ../goole-search-console-data/idolbooth.com-Performance-on-Search-YYYY-MM-DD
```

Compare a later pull directly against this 2026-06-05 baseline:

```sh
npm run analyze:gsc -- ../goole-search-console-data/idolbooth.com-Performance-on-Search-YYYY-MM-DD --baseline ../goole-search-console-data/idolbooth.com-Performance-on-Search-2026-06-05
```

The script recalculates total clicks, impressions, CTR, impression-weighted position, last-14-days vs prior-14-days trend, query opportunities, page opportunities, country CTR gaps, and device mix. With `--baseline`, it also reports total movement, last-14-day movement, tracked page movement, tracked query movement, country movement, and device movement.

The backend funnel queries are also reproducible and default to printing read-only SQL only:

```sh
cd /Users/tm/idolbooth/server
npm run analyze:funnel
```

After confirming Cloudflare credentials and that the target environment is intentional, run the same read-only query pack against D1:

```sh
npm run analyze:funnel -- --remote
```

The query pack covers registered users, paid plan state, Stripe linkage, generation volume, success/failure/running state, stale-generation risk, user generation-depth buckets, format demand, checkout/webhook telemetry from `billing_events`, checkout trigger mix, and Binder saves. It returns only aggregates, not user-level emails, image refs, or payment identifiers.

Deployment follow-up is tracked in [Post-Deploy Measurement Runbook - 2026-06-05](./post-deploy-measurement-runbook-2026-06-05.md).

## Executive Summary

IdolBooth has clear search demand and early product usage, but the paid funnel is not yet working. Search exposure is growing: GSC shows 1,573 clicks, 9,323 impressions, 16.87% CTR, and an impression-weighted average position of 8.33. The last 14 days improved to 508 clicks and 3,014 impressions with position 7.70, up from 363 clicks, 2,131 impressions, and position 9.50 in the prior 14 days.

The biggest SEO opportunity is not broad keyword expansion yet. It is capturing existing rank 4-10 demand around `kpop photobooth online free`, `photo with idol`, and `photobooth web/online kpop`.

Product/backend data shows stronger activation than monetization: 63 registered users, 48 users with at least one generation, and 90 total generations. But paid users are 0, all generations use visible watermarking, and there are no Stripe customer or subscription IDs recorded. This makes paid conversion the primary business gap.

The largest product experience risk is generation reliability. Production has 16 `running` generations, all older than 1 hour and 14 older than 24 hours. Those are almost certainly stale jobs. This hurts trust before users ever reach a serious paid decision.

## Search Console Findings

### Overall Trend

| Metric            |                    Value |
| ----------------- | -----------------------: |
| Clicks            |                    1,573 |
| Impressions       |                    9,323 |
| CTR               |                   16.87% |
| Weighted position |                     8.33 |
| Date range        | 2026-03-02 to 2026-06-01 |

Recent momentum is positive:

| Period        | Clicks | Impressions |    CTR | Weighted position |
| ------------- | -----: | ----------: | -----: | ----------------: |
| Prior 14 days |    363 |       2,131 | 17.03% |              9.50 |
| Last 14 days  |    508 |       3,014 | 16.85% |              7.70 |

### Top Query Opportunities

| Query                            | Clicks | Impressions |   CTR | Position | Click upside to 25% CTR |
| -------------------------------- | -----: | ----------: | ----: | -------: | ----------------------: |
| photobooth web kpop free         |     51 |         440 | 11.6% |      8.9 |                     +59 |
| photobooth online kpop           |     41 |         380 | 10.8% |      6.4 |                     +54 |
| idol photobooth                  |     37 |         264 | 14.0% |      7.6 |                     +29 |
| photobooth idol web              |     21 |         199 | 10.6% |      8.9 |                     +29 |
| photo with idol                  |     66 |         336 | 19.6% |      4.9 |                     +18 |
| photobooth online free with idol |     18 |         125 | 14.4% |      5.4 |                     +13 |

### Page-Level Findings

| Page               | Clicks | Impressions |    CTR | Position | Interpretation                                                                          |
| ------------------ | -----: | ----------: | -----: | -------: | --------------------------------------------------------------------------------------- |
| `/`                |  1,482 |       7,868 | 18.84% |     7.18 | Main traffic collector, already resonating with broad intent.                           |
| `/photo-with-idol` |     91 |       1,477 |  6.16% |     8.24 | Large impression pool, weak CTR; should be a real intent page, not a client redirect.   |
| `/photo-strip`     |      0 |          30 |  0.00% |     3.13 | Small but high-position no-click page; improve SERP title and direct users to `/strip`. |
| `/photo-booth`     |      5 |         204 |  2.45% |    47.61 | Legacy URL should redirect to `/strip`.                                                 |
| `/template`        |      1 |          48 |  2.08% |    11.67 | Legacy URL should redirect to `/templates`.                                             |

### Geography And Device

Top markets by clicks are Indonesia, Philippines, India, Malaysia, Vietnam, Singapore, and Hong Kong. Vietnam has high impressions but lower CTR at 9.5%, so it is a good copy/localization test market. The United States has 372 impressions, only 11 clicks, and position 32.6; it should not be the short-term SEO focus.

Desktop and mobile have nearly equal impressions, but mobile CTR is weaker:

| Device  | Clicks | Impressions |   CTR | Position |
| ------- | -----: | ----------: | ----: | -------: |
| Desktop |    829 |       4,335 | 19.1% |      9.9 |
| Mobile  |    629 |       4,328 | 14.5% |      7.0 |
| Tablet  |    115 |         660 | 17.4% |      6.5 |

## Backend Findings

### Funnel Snapshot

| Metric                             |       Value |
| ---------------------------------- | ----------: |
| Registered users                   |          63 |
| Users created last 7 days          |          14 |
| Users created last 30 days         |          63 |
| Users with at least one generation | 48 (76.19%) |
| Paid users                         |           0 |
| Users with Stripe customer ID      |           0 |
| Users with subscription ID         |           0 |
| Total generations                  |          90 |
| Generations last 7 days            |          19 |
| Generations last 30 days           |          90 |
| Successful generations             |          66 |
| Failed generations                 |           8 |
| Running generations                |          16 |
| Total generation cost              |       $2.64 |
| Cost per success                   |       $0.04 |
| Binder items                       |           8 |
| Users with Binder item             |           4 |

### Generation Reliability

| Status    | Count |  Share | Oldest     | Newest     | Older than 1h | Older than 24h |
| --------- | ----: | -----: | ---------- | ---------- | ------------: | -------------: |
| succeeded |    66 | 73.33% | 2026-05-08 | 2026-06-04 |            66 |             64 |
| running   |    16 | 17.78% | 2026-05-10 | 2026-06-04 |            16 |             14 |
| failed    |     8 |  8.89% | 2026-05-08 | 2026-05-25 |             8 |              8 |

Completed-generation success rate is 89.2% (`66 / (66 + 8)`), but user-visible reliability is worse because stale `running` jobs never resolve. Those stale jobs should be counted as a production defect until there is a proper async job lifecycle.

### Usage Depth

| Generation count per user | Users |  Share |
| ------------------------- | ----: | -----: |
| 0                         |    15 | 23.81% |
| 1                         |    24 | 38.10% |
| 2-3                       |    23 | 36.51% |
| 4-9                       |     1 |  1.59% |

Average generations per registered user is 1.41. Max generations per user is 4. This means current users are trying the product, but repeat usage is shallow. Paid conversion will likely need a stronger post-result loop, not just more traffic.

### Format Demand

| Format    | Generations |  Share |
| --------- | ----------: | -----: |
| selca     |          56 | 62.22% |
| photocard |          33 | 36.67% |
| strip     |           1 |  1.11% |

The app is currently more AI selca/photocard than classic strip in real usage, while GSC demand is heavily `photobooth`. The landing copy can keep `photobooth` for search, but the product flow should route users quickly into selca/photocard creation where engagement exists.

## Changes Already Landed

- Fixed static SEO head in `index.html`: canonical link, lower-case canonical domain, valid OG/Twitter image URLs, current title/description, and schema SearchAction target.
- Added Cloudflare Pages redirects for `/photo-booth` and legacy `/template` paths.
- Changed `/photo-with-idol` into a real rendering route with dedicated title and description instead of a client-side redirect to `/selca`.
- Added a default `polaroid-selca` concept for `/photo-with-idol` so search visitors can land directly on the photo-upload step instead of choosing a concept first.
- Updated `/photo-strip` title, description, social image, and empty-state CTAs to capture its small high-position no-click search opportunity without breaking the existing upload-based strip tool.
- Aligned the visible `/photo-strip` H1, intro copy, and upload empty-state copy with the GSC opportunity "free K-pop photo strip maker online" / idol photobooth strip intent, because the page had position 3.13 but 0 clicks.
- Added "No app download" to the `/photo-strip` intro copy to make the browser-only promise visible before upload.
- Added a homepage product entry for `/photo-with-idol` and exact-match internal links for `K-pop photobooth online free`, `photo with idol`, `photobooth web K-pop free`, and `idol photobooth`.
- Added above-fold trust points on `/photo-with-idol` for "free online in your browser", "no app download", and included watermarked output, directly targeting the mobile/Vietnam CTR gap.
- Added related K-pop photobooth links on `/photo-with-idol` so users and crawlers can continue to `/strip`, `/templates`, and `/photocard`.
- Updated template gallery/category SEO copy and internal links so template browsing uses canonical `/templates` URLs and starts templates at `/strip?template=...` instead of the legacy `/photo-booth` route.
- Updated sitemap generation and `public/sitemap.xml` so `/photo-with-idol` is included, non-canonical query URLs are removed, and deprecated `priority` / `changefreq` tags are no longer emitted.
- Tightened `robots.txt` to keep account, admin, API, auth, and webhook routes out of crawler paths while preserving the sitemap reference.
- Added SPA route analytics for GA4 `page_view`, with sanitized query parameters, so route changes can be measured without relying on a full browser reload.
- Added one-per-session GA4 `landing_view` tracking with landing path, route type, referrer domain, and UTM fields for search-to-product funnel analysis.
- Added GA4 event tracking for generation and monetization funnel steps:
  - `page_view`
  - `landing_view`
  - `concept_auto_select`
  - `concept_select`
  - `upload_guidance_view`
  - `photo_upload`
  - `generate_start`
  - `generate_success`
  - `generate_error`
  - `sign_in_prompt`
  - `upgrade_view`
  - `upgrade_click`
  - `checkout_start`
  - `checkout_error`
  - `checkout_return`
  - `result_action`
- Allowed guest generation attempts to use the backend anonymous quota instead of forcing Google sign-in before the first generation.
- Added upload-step trust guidance for search users before they choose a file: any selfie or screenshot works, the photo is only used for this generation, and free output keeps a visible watermark.
- Added a value-based upgrade panel on successful free/guest results, with CTAs for watermark removal and plan comparison.
- Added a dedicated result-screen `HD download` upgrade CTA that uses `trigger_surface=result_hd_download`, so high-intent export demand can be measured separately from generic plan comparison.
- Added a watermarked result download action with `result_action=download`, plus a `download_fallback` event when the browser must open the image in a new tab, so result utility can be measured separately from save, share, and variation actions while HD/watermark-free export remains a paid value prop.
- Added real authenticated quota data to `/auth/me` and wired frontend quota displays/guards to the backend quota snapshot, so credit exhaustion can trigger the right upgrade experience.
- Updated the generation flow to apply the API-returned `quotaRemaining` immediately after success or quota exhaustion, covering guest sessions where `/auth/me` cannot expose server-side anonymous quota.
- Added upgrade-dialog source attribution into `upgrade_view`, `sign_in_prompt`, `checkout_start`, and `checkout_error`, so result-watermark, result-value, quota, and pricing-page upgrade paths can be compared.
- Persisted non-sensitive checkout source attribution in `billing_events` (`source`, `trigger_surface`) and surfaced admin aggregates for upgrade-dialog, pricing-page, watermark-removal, HD-download, and quota-triggered checkout intent.
- Changed upgrade and pricing checkout CTAs so signed-out users are sent to Google sign-in first, instead of failing checkout and only seeing a toast.
- Preserved the selected paid plan through Google sign-in from both the upgrade dialog and `/pricing`, then resumed checkout automatically in the original tab with `resumed_after_sign_in` analytics, reducing the chance that signed-out purchase intent is lost.
- Persisted the same signed-out checkout recovery path in D1 as `billing_events.checkout_flow` (`direct` vs `resumed_after_sign_in`) and added an Admin overview count for resumed checkout starts.
- Added checkout-failure tracking for upgrade dialog and pricing page failures.
- Added a non-sensitive `billing_events` table and backend writes for checkout creation, checkout failure, stale-customer checkout recovery, subscription webhooks, and ignored webhooks.
- Added checkout return feedback for `/me?billing=success` and `/pricing?billing=cancelled`, with `checkout_return` analytics for user-visible return states.
- Added admin overview metrics for paid users, stale pending generation jobs, checkout opened/failed/recovered counts, and subscription webhook counts.
- Added an admin maintenance action to clean stale generation jobs on demand and refund active registered-user quota.
- Updated pricing copy to remove "stubs" language.
- Reduced Kie provider default timeout to 55 seconds so new requests can fail, refund quota, and close status instead of waiting up to 15 minutes.
- Updated generation loading copy to "usually under a minute" to better match the actual timeout window.
- Added a scheduled stale-generation cleanup in the Worker. Every 30 minutes it marks `queued` or `running` generations older than 1 hour as `failed`, sets a timeout error message, and refunds active registered-user quota where applicable.
- Added `--baseline` support to the local GSC export analyzer so new Search Console exports can be compared against the 2026-06-05 baseline without manually rebuilding the scorecard.

## Priority Roadmap

### P0 - Deploy And Stabilize

1. Deploy the SEO, routing, analytics, guest-generation, and timeout fixes.
   - Use the post-deploy measurement runbook to verify routes, sitemap, GA4 events, D1 aggregates, Stripe checkout, and webhook reconciliation.
2. Run the admin stale-job cleanup once after deployment for existing production `running` generations older than 1 hour:
   - Mark as `failed`.
   - Set `error_message` to a clear timeout/stale-job reason.
   - Refund quota where safe and auditable.
3. Monitor the recurring stale-job guard added in code:
   - Any `queued` or `running` generation older than 1 hour becomes `failed`.
   - Active registered-user quota is refunded where applicable.
   - Long-term fix is still an async job model: create task, return job ID, poll status endpoint, update DB from scheduled polling or callback.
4. Confirm Stripe checkout health:
   - Use GA4 `checkout_start` and `checkout_return`.
   - Segment `checkout_start` and D1 `billing_events` by `surface` / `source`, `trigger_surface`, and `checkout_flow` to identify whether watermark removal, quota exhaustion, generic plan comparison, or signed-out checkout recovery is driving payment intent.
   - Use admin `billing_events` metrics for checkout-created, failed, recovered, and webhook-updated counts.
   - Reconcile D1 users with Stripe events after webhook calls.

### P1 - Improve SEO Capture

1. Keep `/photo-with-idol` as a real intent route and monitor CTR weekly.
2. Monitor `/photo-strip` separately from `/strip`: it has only 30 impressions, but average position 3.13 and 0 clicks, so the first test is whether the new "Free K-pop Photo Strip Maker Online" title earns any CTR.
3. Monitor the new homepage and `/photo-with-idol` internal links that directly include:
   - "K-pop photobooth online free"
   - "photo with idol"
   - "photobooth web K-pop free"
   - "idol photobooth"
4. Monitor whether canonical `/templates` pages inherit old `/template` impressions after deployment now that internal links and template-start CTAs point to `/templates` and `/strip`.
5. Treat Vietnam and mobile as CTR test segments:
   - Shorter title.
   - Stronger "free online" promise.
   - First-screen proof that no app download is required.

### P1 - Improve Product Activation

1. Keep first successful generation before hard sign-in when possible.
2. After first result, show value-based actions:
   - Download watermarked result.
   - Remove watermark.
   - HD download.
   - More variations.
   - Save Binder.
3. Monitor the upload-step trust guidance for users who land on the generator but do not upload:
   - "Use any selfie or screenshot."
   - "Your photo is only used for this generation."
   - "Visible watermark on free output."
4. Track the funnel from search landing to result:
   - Landing view with route type, referrer domain, and UTM fields.
   - SPA page view.
   - Concept select.
   - Upload.
   - Generate start.
   - Generate success/fail/stale.
   - Result action.
   - Upgrade view.
   - Checkout start.
   - Checkout return.
   - Checkout success.

### P2 - Improve Paid Rate

Current paid rate is 0%. Do not optimize only the pricing page until checkout telemetry exists.

Paid experiments should happen after users see a result:

1. Free result keeps visible watermark.
2. Plus CTA: smaller/no intrusive watermark, 30 daily generations, more variations.
3. Pro CTA: watermark-free export, HD download, print/PDF tools.
4. Keep the result-screen upgrade panel live and measure which CTA wins:
   - Remove watermark.
   - HD download.
   - View plans.
   - Quota exhaustion.
5. A/B test:
   - "Remove watermark" CTA.
   - "Make 3 more variations" CTA.
   - "HD download" CTA.

## Success Metrics

### SEO

- `/photo-with-idol` CTR from 6.16% to 10%+.
- `/photo-strip` CTR from 0% to first clicks while preserving average position near top 5.
- Top quick-win query CTR from 10-14% to 18%+.
- Last-14-day impressions continue growing without CTR collapse.
- Mobile CTR from 14.5% to 17%+.

### Product

- Generation stale-running rate: under 1%.
- Completed-generation success rate: 90%+.
- Upload-to-generate-start rate: baseline needed from GA4.
- Generate-start-to-success rate: baseline after instrumentation deploy.
- Authenticated quota accuracy: `/auth/me.quota.remaining` should match backend quota after each successful generation.
- Result-action rate: save/share/variation/download.

### Monetization

- Paid user rate: from 0% to first 1-3%.
- Checkout-start rate from result screen.
- Checkout-start mix by upgrade trigger: `result_watermark`, `result_hd_download`, `result_value`, `result_quota`, quota-exhausted surfaces, and pricing page.
- Signed-out upgrade recovery: share of `checkout_start` events where `resumed_after_sign_in=true`, reconciled with D1 `billing_events.checkout_flow='resumed_after_sign_in'`.
- Checkout-start-to-success rate.
- Checkout-created-to-webhook-updated rate from `billing_events`.
- Revenue per successful generation.
- Cost per successful generation stays near or below $0.04 unless output quality improves enough to justify higher cost.

## Open Data Gaps

- GA4 events must be deployed and collected before landing-to-generation conversion can be measured.
- Stripe checkout telemetry is now persisted in non-sensitive `billing_events`, but it still needs deployment and reconciliation against Stripe after live checkout attempts.
- There is no authoritative frontend `checkout_success` event; webhook success should remain the source of truth.
- Current D1 production data is early-stage with only 63 users and 90 generations, so directional conclusions are valid, but exact conversion targets should be revised after the next 200-500 generation attempts.
