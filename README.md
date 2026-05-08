# IdolBooth V3 Local Setup

IdolBooth is a Vite/React frontend with a Hono backend. Production database access is configured for Cloudflare D1; SQLite remains available for local-only fallback and tests. The frontend lives in `idol-capture-magic/`; the backend lives in `server/`.

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

The image provider uses `KIE_API_KEY`. For D1, set `DATABASE_BACKEND=d1`, `D1_DATABASE_NAME`, `D1_DATABASE_ID`, `CLOUDFLARE_ACCOUNT_ID`, and `CLOUDFLARE_API_TOKEN`. Do not commit `.env` files.

## Database

```sh
cd /Users/tm/idolbooth/server
npm run db:migrate
npm run seed
```

For Cloudflare-managed D1 migrations, use:

```sh
cd /Users/tm/idolbooth/server
npm run d1:migrate
```

The seed script writes to the selected `DATABASE_BACKEND`; set it to `sqlite` only when you want to seed the local `DATABASE_URL`.

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
