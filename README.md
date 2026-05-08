# IdolBooth V3 Local Setup

IdolBooth is a Vite/React frontend with a Hono backend backed by Cloudflare D1. The frontend lives in `idol-capture-magic/`; the backend lives in `server/`.

## Prerequisites

- Node.js 20.10 or newer
- npm

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

The image provider uses `KIE_API_KEY`. D1 operations require `D1_DATABASE_NAME`, `D1_DATABASE_ID`, `CLOUDFLARE_ACCOUNT_ID`, and `CLOUDFLARE_API_TOKEN`. Do not commit `.env` files.

## Database

The backend is D1-only. Drizzle still uses the `sqlite` dialect internally because that is the SQL dialect exposed by D1; there is no local database fallback.

```sh
cd /Users/tm/idolbooth/server
npm run d1:migrate
npm run seed
```

D1 local migrations are available for Miniflare/Wrangler development:

```sh
cd /Users/tm/idolbooth/server
npm run d1:migrate:local
```

## Run

Start the backend:

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

## Frontend Deploy

Frontend deploys are done from the local command line with pnpm and Wrangler direct upload to the existing Cloudflare Pages project `idolbooth`.

```sh
cd /Users/tm/idolbooth/idol-capture-magic
pnpm install
pnpm exec wrangler login
pnpm cf:deploy
```

`pnpm cf:deploy` runs `generate-sitemap`, builds the Vite app into `dist/`, then uploads `dist/` to Cloudflare Pages as the `main` production branch. Set production Vite variables locally before deploying, for example in `.env.production`.

If Cloudflare Git automatic deployments are still enabled in the dashboard, disable them so production publishes only happen through `pnpm cf:deploy`.

## Checks

```sh
cd /Users/tm/idolbooth/server
npm run lint
npm run build
npm test

cd /Users/tm/idolbooth/idol-capture-magic
npm run lint
npm run build
npm run generate-sitemap
```

With both dev servers running, run:

```sh
/Users/tm/idolbooth/scripts/smoke-test.sh
```
