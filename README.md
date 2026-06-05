# IdolBooth V3 Local Setup

IdolBooth is a Vite/React frontend deployed to Cloudflare Pages and a Hono backend deployed to Cloudflare Workers with D1 and R2. The frontend lives in `idol-capture-magic/`; the backend lives in `server/`.

## Prerequisites

- Node.js 20.10 or newer
- npm
- pnpm for the frontend deploy command
- Cloudflare Wrangler login or `CLOUDFLARE_API_TOKEN`

## Install

```sh
cd /Users/tm/idolbooth/server
npm install

cd /Users/tm/idolbooth/idol-capture-magic
npm install
```

## Environment

Copy the examples and fill in local values:

```sh
cp /Users/tm/idolbooth/server/.env.example /Users/tm/idolbooth/server/.env
cp /Users/tm/idolbooth/idol-capture-magic/.env.example /Users/tm/idolbooth/idol-capture-magic/.env
```

For Worker local dev, put runtime secrets in `/Users/tm/idolbooth/server/.dev.vars`. Do not commit `.env` or `.dev.vars` files.

## Cloudflare Resources

The backend is deployed as Worker `idolbooth-api`. It uses D1 database `batchloom-db` and R2 bucket `idolbooth-storage`.

```sh
cd /Users/tm/idolbooth/server
npm run cf:r2:create
npm run d1:migrate
npm run seed
```

If the R2 bucket already exists, `npm run cf:r2:create` can be skipped. Seed uses the Cloudflare D1 HTTP API, so `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, and `D1_DATABASE_ID` must be available locally.

Set Worker secrets:

```sh
cd /Users/tm/idolbooth/server
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put KIE_API_KEY
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET
npx wrangler secret put STRIPE_PLUS_MONTHLY_PRICE_ID
npx wrangler secret put STRIPE_PLUS_ANNUAL_PRICE_ID
npx wrangler secret put STRIPE_PRO_MONTHLY_PRICE_ID
npx wrangler secret put STRIPE_PRO_ANNUAL_PRICE_ID
```

## Run

Start the backend in the Cloudflare Workers runtime:

```sh
cd /Users/tm/idolbooth/server
npm run dev
```

Start the frontend in another terminal:

```sh
cd /Users/tm/idolbooth/idol-capture-magic
npm run dev
```

Open `http://localhost:8080`.

## Deploy

Deploy the backend Worker:

```sh
cd /Users/tm/idolbooth/server
npm run cf:deploy:full
```

Deploy the frontend to the new Cloudflare Pages project `idolbooth-web`:

```sh
cd /Users/tm/idolbooth/idol-capture-magic
pnpm install
pnpm cf:create
pnpm cf:deploy
```

Point `idolbooth.com` to the `idolbooth-web` Pages project and `api.idolbooth.com` to the `idolbooth-api` Worker. Set frontend production variables locally before deploy, for example:

```sh
VITE_API_BASE_URL=https://api.idolbooth.com
VITE_PUBLIC_APP_ORIGIN=https://idolbooth.com
VITE_STRIPE_PUBLISHABLE_KEY=pk_...
```

R2 generated images are returned through the R2 custom domain configured in [server/wrangler.jsonc](/Users/tm/idolbooth/server/wrangler.jsonc):

```sh
PUBLIC_STORAGE_ORIGIN=https://cdn.idolbooth.com
```

Keep the `idolbooth-storage` bucket custom domain pointed at `cdn.idolbooth.com`.

Google OAuth must use the API callback URL, not the frontend app URL:

```sh
GOOGLE_REDIRECT_URI=https://api.idolbooth.com/auth/google/callback
```

Add that exact URL to the Google OAuth client's authorized redirect URIs. The Worker redirects users back to `PUBLIC_APP_ORIGIN` after the callback succeeds.

## Checks

```sh
cd /Users/tm/idolbooth/server
npm run lint
npm run build
npm test
npx wrangler deploy --dry-run

cd /Users/tm/idolbooth/idol-capture-magic
npm run lint
npm run build
npm run generate-sitemap
```

With both dev servers running, run:

```sh
/Users/tm/idolbooth/scripts/smoke-test.sh
```
