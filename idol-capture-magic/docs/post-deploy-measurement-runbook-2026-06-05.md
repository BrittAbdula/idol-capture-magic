# Post-Deploy Measurement Runbook - 2026-06-05

This runbook turns the optimization plan into a repeatable measurement loop after deployment. It is designed to answer three questions:

- Did search exposure improve without hurting CTR?
- Did visitors reach a successful generated result more reliably?
- Did result-screen intent turn into checkout and paid users?

Use aggregate outputs only. Do not export user-level emails, image refs, payment identifiers, or raw uploaded-image data for this review.

## Source Commands

Run these from the repo after deployment.

```sh
cd /Users/tm/idolbooth/idol-capture-magic
npm run analyze:gsc
```

Compare a new export against the 2026-06-05 baseline:

```sh
npm run analyze:gsc -- ../goole-search-console-data/idolbooth.com-Performance-on-Search-YYYY-MM-DD --baseline ../goole-search-console-data/idolbooth.com-Performance-on-Search-2026-06-05
```

Use `--json` on the same command when you need machine-readable `baselineComparison` output for a weekly scorecard.

```sh
cd /Users/tm/idolbooth/server
npm run analyze:funnel -- --remote
```

The GSC export can lag by days, so the D1 and GA4 checks are the first 24-hour signal. GSC becomes useful for the SEO test at 7-14 days.

## T+0 Deployment Verification

Run immediately after deploying frontend and backend.

| Check                                                                       | Evidence                                                           | Action if failed                                              |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------- |
| `/photo-with-idol`, `/photo-strip`, `/strip`, `/templates`, `/pricing` load | Browser or `curl -I` returns 200/redirect as expected              | Roll back frontend or fix routing before submitting sitemap   |
| `/photo-booth` redirects to `/strip`                                        | 301/302/Pages redirect observed                                    | Fix `_redirects` before GSC recrawls legacy URL               |
| `/template` redirects to `/templates`                                       | 301/302/Pages redirect observed                                    | Fix `_redirects` and internal template links                  |
| `https://idolbooth.com/sitemap.xml` contains canonical URLs only            | Sitemap includes `/photo-with-idol`, excludes query URLs           | Regenerate sitemap and redeploy frontend                      |
| `/auth/me` returns `quota` for signed-in users                              | API response includes `quota.remaining`                            | Fix backend auth/quota before paid funnel tests               |
| Admin overview loads for admin account                                      | Admin dashboard returns aggregate stats                            | Fix admin auth/API before relying on D1 dashboard             |
| Stripe checkout can be opened from result and pricing surfaces              | `billing_events.checkout_created` or `checkout_failed` is recorded | Fix checkout request path, Stripe price IDs, or auth redirect |
| Webhook writes subscription events after test checkout                      | `billing_events.webhook_subscription_updated` is recorded          | Fix Stripe webhook secret or endpoint routing                 |

## T+24h Product And Paid Funnel Review

Use GA4 for frontend events and D1 for backend truth.

| Question                          | Primary metric                                             | Target                            | If below target                                                     |
| --------------------------------- | ---------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------- |
| Are search visitors tracked?      | `landing_view` with organic/referrer fields                | Non-zero for organic landings     | Check GA config and SPA route analytics                             |
| Do users upload after landing?    | `photo_upload / landing_view` by route                     | Establish baseline                | Improve first-screen guidance and reduce concept-selection friction |
| Do users start generation?        | `generate_start / photo_upload`                            | Establish baseline                | Check upload errors, quota prompt timing, and mobile UI             |
| Do generation attempts succeed?   | `generate_success / generate_start` and D1 success rate    | 90%+ completed-generation success | Inspect Kie timeout/error mix, stale jobs, and quota refunds        |
| Are stale jobs controlled?        | D1 `running`/`queued` older than 1h                        | Under 1% of generations           | Run admin cleanup once if needed; inspect scheduled handler         |
| Do users use the result?          | `result_action` mix: download/share/variation/save         | Establish baseline                | Make result actions more visible before adding more paid prompts    |
| Does result intent reach upgrade? | `upgrade_view` and `upgrade_click` by `trigger_surface`    | Non-zero for result surfaces      | Rework result panel copy and CTA placement                          |
| Does checkout start?              | GA4 `checkout_start`; D1 `billing_events.checkout_created` | Non-zero after live intent        | Check signed-out recovery, Stripe price IDs, and checkout route     |
| Does checkout complete?           | D1 webhook subscription update                             | First paid users                  | Fix webhook reconciliation before optimizing pricing copy           |

## T+7d SEO And Funnel Review

Run the GSC export analysis with the newest Search Console export and compare to the 2026-06-05 baseline:

```sh
cd /Users/tm/idolbooth/idol-capture-magic
npm run analyze:gsc -- ../goole-search-console-data/idolbooth.com-Performance-on-Search-YYYY-MM-DD --baseline ../goole-search-console-data/idolbooth.com-Performance-on-Search-2026-06-05
```

Read the `Baseline comparison` tables for total movement, last-14-day movement, tracked page movement, tracked query movement, country movement, and device movement.

| Area                   |                           Baseline | Good signal                               | Action if weak                                                             |
| ---------------------- | ---------------------------------: | ----------------------------------------- | -------------------------------------------------------------------------- |
| `/photo-with-idol` CTR |                              6.16% | 8-10%+                                    | Rewrite title/meta around "photo with idol"; add stronger above-fold proof |
| `/photo-strip` CTR     |                                 0% | First clicks while position remains top 5 | Keep the title test; add clearer snippet and internal links                |
| Mobile CTR             |                             14.53% | 16-17%+                                   | Make "free online, no app download" visible earlier                        |
| Vietnam CTR            |                              9.46% | 12%+                                      | Test shorter English copy or localized support text                        |
| Quick-win query CTR    | 10-14% for several rank 4-10 terms | 18%+                                      | Adjust page titles/internal anchors around terms with impressions          |
| Running/stale jobs     | 16 stale running jobs before fixes | Near zero                                 | Prioritize async job lifecycle before more traffic work                    |
| Paid users             |                                  0 | First 1-3% of registered users            | Keep result-screen paid CTA tests; do not optimize pricing page alone      |

## T+14d Decision Rules

Use these rules to choose the next iteration.

| Evidence                                                       | Decision                                                                           |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Impressions rise but CTR drops on `/photo-with-idol`           | Keep the route, rewrite title/meta and first-screen copy; do not add new pages yet |
| `/photo-with-idol` CTR improves but upload rate is weak        | Prioritize upload guidance, concept auto-select, and mobile layout                 |
| Upload rate is healthy but success rate is under 90%           | Prioritize reliability and async job lifecycle                                     |
| Result downloads are high but checkout starts are low          | Test "remove watermark" and "HD download" CTA copy/placement                       |
| Checkout starts exist but webhooks do not update subscriptions | Treat Stripe webhook/configuration as the monetization blocker                     |
| Checkout failures exceed 10% of checkout attempts              | Inspect Stripe error codes and stale customer recovery                             |
| Signed-out checkout recovery is common but completion is low   | Improve Google sign-in return clarity before changing prices                       |
| Quota-triggered checkout dominates                             | Make quota limits and plan value clearer before the final free generation          |
| Pricing-page checkout dominates but result checkout is weak    | Bring result-specific value props into the result panel                            |

## Weekly Review Template

Copy this into the weekly review.

```md
## IdolBooth Growth Review - YYYY-MM-DD

### SEO

- GSC range:
- Clicks / impressions / CTR / position:
- Top query movement:
- Page movement:
- Mobile and Vietnam CTR:

### Product

- Landing views:
- Upload rate:
- Generate-start rate:
- Success rate:
- Stale jobs:
- Result-action mix:

### Monetization

- Upgrade views / clicks:
- Checkout starts:
- Checkout created / failed / recovered:
- Subscription webhooks:
- Paid users:
- Revenue per successful generation:

### Decisions

- Keep:
- Change:
- Stop:
- Next experiment:
```
