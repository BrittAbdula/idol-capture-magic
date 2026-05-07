# IdolBooth API

All JSON responses are parsed through route-local zod schemas before being sent.

## Public Domain

- `GET /api/groups`
- `GET /api/groups/:slug`
- `GET /api/members/:groupSlug/:memberSlug`
- `GET /api/concepts?memberId=&format=`
- `GET /api/campaigns`
- `GET /api/campaigns/:slug`
- `GET /api/share/:generationId`
- `GET /api/binder/public/:handle`

## Authenticated Binder

- `GET /api/binder/items`
- `POST /api/binder/items`
- `DELETE /api/binder/items?id=...`
- `DELETE /api/binder/items/:id`

## Auth, Generation, Billing

- `GET /auth/google`
- `GET /auth/google/callback`
- `POST /auth/logout`
- `GET /auth/me`
- `POST /api/generate`
- `GET /api/generations/:id`
- `POST /api/billing/checkout`
- `POST /api/billing/portal`
- `POST /webhooks/stripe`
