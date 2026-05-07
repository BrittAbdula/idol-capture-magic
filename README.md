# IdolBooth V3 Local Setup

IdolBooth is a Vite/React frontend with a Hono/SQLite backend. The frontend lives in `idol-capture-magic/`; the backend lives in `server/`.

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

The image provider uses `KIE_API_KEY`. Do not commit `.env` files.

## Database

```sh
cd /Users/tm/idolbooth/server
npm run db:migrate
npm run seed
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
