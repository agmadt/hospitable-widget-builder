# Developer guide

How the builder is put together, and how to run, test and host it. Hosts using the builder only need the [README](../README.md).

Vue 3 + Vite + TypeScript, no backend: it never sees a host's token and only talks to the host's own Worker through its public endpoints. The kit it writes snippets for (the Worker and `widget.js`) is [hospitable-widgets](https://github.com/agmadt/hospitable-widgets).

## Develop

```sh
npm install
npm run dev          # http://127.0.0.1:5173
```

The preview runs the real `widget.js`, its modules and the starter templates, all loaded up front. During `npm run dev` they come from the kit checkout next to this folder (`../hospitable-widgets/widget/`, served at `/hosp/`; or set `KIT_DIR`), so edits show on reload. Production builds load the release named in `VITE_WIDGET_VERSION` from jsDelivr.

For the Connect step, run the kit's Worker in dummy mode alongside (`npm run dev` in `hospitable-widgets` with `HOSPITABLE_PAT=dummy`); "Try the demo Worker" points at it in development.

| Command | Does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Type-check, then build to `dist/` |
| `npm test` | Unit and component tests (Vitest, happy-dom) |
| `npm run typecheck` | `vue-tsc` |
| `npm run e2e` | Every widget type in real Chrome: the copied snippet must render exactly like the preview, then again from the browser's copy with the Worker blocked; plus a designed widget (preset, fonts, options) and a first visit with the Worker down. Needs both dev servers; set `CHROME_PATH` if Chrome isn't in the default macOS location. |
| `npm run sync-sample` | Refresh `src/assets/dummy.json` from a dummy-mode Worker |

## Settings

Public settings live in `.env` (override in `.env.local`):

| Variable | Meaning |
| --- | --- |
| `VITE_KIT_REPO` | The public kit on GitHub, `owner/repo`. Drives the Deploy button and the jsDelivr URL in snippets. |
| `VITE_WIDGET_MAJOR` | Major version of `widget.js` snippets load (`1` → `@1`, the newest 1.x). |
| `VITE_WIDGET_VERSION` | Exact release the builder's own preview loads, so it never meets an older copy while jsDelivr still serves the previous one as `@1`. Bump it after tagging a kit release. |
| `VITE_DEMO_WORKER` | A Worker deployed with `HOSPITABLE_PAT=dummy`, for "Try the demo Worker". `.env.development` points it at the local one. |

The kit's `BUILDER_URL` (in its `wrangler.jsonc`) points at `https://hospitable-widget.adhityoagam.com/`, so a fresh Worker sends the host back here.

## Hosting

Cloudflare Pages builds and serves the builder from this repo at `hospitable-widget.adhityoagam.com`. Pages project settings:

| Setting | Value |
| --- | --- |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Environment variable | `NODE_VERSION` = `22` |

Every push to `main` deploys. If the builder moves, update the kit's `BUILDER_URL` too. A host who runs their own copy sets `BUILDER_URL` in their Worker copy's `wrangler.jsonc` instead (it's a deploy-page value, and every deploy sends that file's value to Cloudflare); the README's [Run your own builder](../README.md#run-your-own-builder) walks them through it.

## Layout

```
src/
  App.vue                 shell: top bar, step panel, preview
  stores/builder.ts       all state; the design is saved in localStorage
  components/             TopBar, PreviewStage, WidgetPreview, the four steps, design/*, ui/*
  composables/            useSnippet, useWeight (JavaScript + Worker requests per widget), useToast
  lib/
    templates.ts          starter templates (from the kit) and which options go in the snippet
    snippet.ts            the one-line snippet (or a <template> for hand-edited HTML), the test page
    style.ts              presets, and which style choices go in the snippet
    sample.ts             sample data for the preview
    worker.ts             connecting to a Worker, token help texts
    widget.ts             loading widget.js
    catalog.ts            the 16 widget types, per-platform paste steps
  assets/dummy.json       sample data (npm run sync-sample)
```

## Templates

The starter templates live in the kit, in [`widget/templates/`](https://github.com/agmadt/hospitable-widgets/tree/main/widget/templates), and load through its `templates` module. The builder uses that module too, so the preview renders exactly what a website will. Their format is described in the kit's [developer guide](https://github.com/agmadt/hospitable-widgets/blob/main/docs/developers.md#starter-templates).

## Presets

The ready-made styles in the Design step are the `PRESETS` list in `src/lib/style.ts`. Each sets `accent`, `text` and `background` (hex colors), `font` and `headingFont`, `card` (`card-border`, `card-shadow` or `''` for none) and `radius` in px. A font is a key of the kit's `FONTS` (such as `system`, `inter` or `lora`), `google:Name` for any Google font, or `site` for the website's own font; `headingFont` can't be `site`, and `same` follows `font`. A preset only fills in the style fields: the snippet carries the resulting values in `data-hosp-style`, so a new preset needs no kit release.
