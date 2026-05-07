# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Layout

This repo is a wrapper around a single Vite/React app. **All source code, configs, and `package.json` live inside `idol-capture-magic/`** — the top-level directory only holds design notes (`design.md`, `overview.md`, `readme.md`, etc.). Run all commands from inside `idol-capture-magic/`.

The app was originally scaffolded by Lovable (`lovable.dev`); `lovable-tagger` is a dev-only Vite plugin and `package.json` is named `idolbooth.com` (the production domain).

## Commands

All commands run from `idol-capture-magic/`:

```sh
npm run dev               # Vite dev server on port 8080 (host "::")
npm run build             # production build
npm run build:dev         # build with development mode (keeps lovable-tagger)
npm run lint              # eslint (flat config, eslint.config.js)
npm run preview           # preview the production build
npm run generate-sitemap  # write public/sitemap.xml from scripts/generate-sitemap.js
```

There is no test runner configured.

## Architecture

IdolBooth is a client-only React SPA that lets users capture webcam photos with K-pop / anime "idol" overlays and assemble them into downloadable photo strips. There is no backend — all state is in-memory React context plus `localStorage` for user settings.

### State: a single context drives the whole app

[src/contexts/PhotoStripContext.tsx](idol-capture-magic/src/contexts/PhotoStripContext.tsx) defines both the **type system** (`Template`, `PhotoPosition`, `PhotoOverlay`, `Background`, `Decoration`, `TextConfig`, `PhotoBoothSettings`, `PhotoStripSessionData`) and the **global store** consumed via `usePhotoStrip()`.

The context exposes both a flat `photos: string[]` array and a richer `photoStripData: PhotoStripSessionData` object. Several updater functions (`updatePhotos`, `updatePhotoOverlays`, `updateBackground`, `updateText`, `updateDecoration`) only mutate `photoStripData` if it already exists — code that updates strip data must ensure `photoStripData` was initialized first (typically by selecting a template). When changing the shape of `Template`, update the type here; `src/data/templates.ts` and the renderers in `WebcamCapture.tsx` / `PhotoStrip.tsx` must move together.

### Relative-coordinate template model (critical)

The `Template` data model uses two coordinate conventions and they are not interchangeable:

- `canvasSize` — absolute pixel dimensions of the final strip (used to set the output canvas and as the divisor for relative coords). Templates in `src/data/templates.ts` historically use absolute pixel positions for `photoPositions`; the long-term direction (see `readme.md`) is **relative units (0–1 proportions)** for `photoPositions` and `photoOverlays.position` so templates render correctly at any output resolution.
- `PhotoOverlay.scale` — when `1.0`, the overlay's longer edge matches the **shorter** edge of its target photo area. This keeps overlay size consistent across photo aspect ratios.
- `PhotoOverlay.position` — the overlay's **center** relative to the top-left of its photo area.

Renderers (`WebcamCapture` for live preview, `PhotoStrip` for the final output) are responsible for converting these relative units into pixel values at draw time. UI controls in `pages/PhotoBooth.tsx` translate user input back into the same relative units before storing.

### Routing and page responsibilities

Routes are declared in [src/App.tsx](idol-capture-magic/src/App.tsx). `App.tsx` also contains a `TitleUpdater` component that hard-codes `<title>` and `<meta name="description">` per route — when adding a new route, also add a case there (the `SEO` component is a separate per-page helper).

Key user flow:
1. `/template` → `/template/:category` (browse) — picks a template, sets it on context.
2. `/photo-booth` — `WebcamCapture` records N photos using the template's `photoBoothSettings`. Persists settings to `localStorage`.
3. `/photo-strip` — composites photos onto a single canvas using `photoPositions`, `photoOverlays`, `background`, `decoration`, `text`. Handles download/share.
4. `/photo-with-idol` — separate AI compositing flow using `@huggingface/transformers` (in-browser ML).
5. `/share` — view a shared strip.

`TemplateCreator` exists but is currently commented out of routing.

### Canvas rendering pipeline

The strip is generated entirely with the 2D Canvas API. `src/lib/imageProcessing.ts` (`processPhotoStripData`) validates and preps the data; the actual draw happens inside `pages/PhotoStrip.tsx` via a `generatePhotoStrip(canvas, scale)` function that takes a scale factor so the same code produces both the on-screen preview and the higher-resolution download. The live webcam preview in `WebcamCapture.tsx` mirrors the same overlay math so what the user sees during capture matches the final composite.

### UI stack

- **shadcn/ui** components live in `src/components/ui/` and are vendored — edit them in place rather than reinstalling. `components.json` configures the generator.
- Path alias `@/` → `src/` (configured in both [vite.config.ts](idol-capture-magic/vite.config.ts) and [tsconfig.json](idol-capture-magic/tsconfig.json)).
- TailwindCSS with `@tailwindcss/typography` and `tailwindcss-animate`. Tokens defined in [tailwind.config.ts](idol-capture-magic/tailwind.config.ts).
- Toasts: both `@/components/ui/toaster` (Radix) and `sonner` are mounted in `App.tsx`. Existing code uses `sonner`'s `toast` for new notifications.
- Data fetching: `@tanstack/react-query` is provider-mounted but the app is currently fully client-side, so it's mostly unused.

## Conventions worth knowing

- TypeScript is configured permissively in `tsconfig.app.json` (`noImplicitAny: false`, `strictNullChecks: false`, unused-locals warnings off). Don't rely on the compiler to catch null/undefined bugs — the runtime renderers do their own guarding.
- The `Template` interface has accumulated optional/duplicate fields (`caption` for backward compat alongside `text: TextConfig`; `Background.url` alongside `imageUrl`). Prefer the newer fields (`text`, `imageUrl`) but keep reads tolerant of the legacy ones.
- Dev server binds to `[::]` on port 8080 (not the Vite default 5173).
