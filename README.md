# Widget builder

Where Hospitable hosts design a listing widget, connect the Worker they deployed, and copy the snippet for their website. Vue 3 + Vite + TypeScript, no backend: it never sees a host's token and only talks to the host's own Worker through its public endpoints.

The kit it writes snippets for (the Worker and `widget.js`) is [hospitable-widgets](https://github.com/agmadt/hospitable-widgets).

## Develop

```sh
npm install
npm run dev          # http://127.0.0.1:5173
```

The preview runs the real `widget.js` and its modules, all loaded up front. During `npm run dev` they come from the kit checkout next to this folder (`../hospitable-widgets/widget/`, served at `/hosp/`; or set `KIT_DIR`), so edits show on reload. Production builds load the released ones from jsDelivr.

For the Connect step, run the kit's Worker in dummy mode alongside (`npm run dev` in `hospitable-widgets` with `HOSPITABLE_PAT=dummy`); "Try the demo Worker" points at it in development.

| Command | Does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Type-check, then build to `dist/` |
| `npm run deploy` | Deploy `dist/` to Cloudflare (run `npm run build` first) |
| `npm test` | Unit and component tests (Vitest, happy-dom) |
| `npm run typecheck` | `vue-tsc` |
| `npm run e2e` | Every widget type in real Chrome: the copied snippet must render exactly like the preview, with the Worker up and with it unreachable. Needs both dev servers; set `CHROME_PATH` if Chrome isn't in the default macOS location. |
| `npm run sync-sample` | Refresh `src/assets/dummy.json` from a dummy-mode Worker |

## Settings

Public settings live in `.env` (override in `.env.local`):

| Variable | Meaning |
| --- | --- |
| `VITE_KIT_REPO` | The public kit on GitHub, `owner/repo`. Drives the Deploy button and the jsDelivr URL in snippets. |
| `VITE_WIDGET_MAJOR` | Major version of `widget.js` snippets load (`1` → `@1`, the newest 1.x). |
| `VITE_DEMO_WORKER` | A Worker deployed with `HOSPITABLE_PAT=dummy`, for "Try the demo Worker". `.env.development` points it at the local one. |

The kit's `BUILDER_URL` (in its `wrangler.jsonc`) points at `https://hospitable-widget.adhityoagam.com/`, so a fresh Worker sends the host back here.

## Hosting

The builder is a Cloudflare Worker with static files only (`hospitable-widget-builder`, see `wrangler.jsonc`), built and deployed by Cloudflare from this repo: build command `npm run build`, deploy command `npx wrangler deploy`. It has no Worker script, so every request is a static asset request, which Cloudflare serves free and without a request limit.

The custom domain `hospitable-widget.adhityoagam.com` is set in the Cloudflare dashboard (Workers & Pages → `hospitable-widget-builder` → Settings → Domains & Routes). If the builder moves, update the kit's `BUILDER_URL` too.

## Layout

```
src/
  App.vue                 shell: top bar, step panel, preview
  stores/builder.ts       all state; the design is saved in localStorage
  components/             TopBar, PreviewStage, WidgetPreview, the four steps, design/*, ui/*
  composables/            useSnippet, useWeight (JavaScript + Worker requests per widget), useToast
  lib/
    templates.ts          starter templates and builder-time options
    snippet.ts            the snippet (with what it needs: data sets, modules, preconnect), its fallback snapshot, the test page
    style.ts              fonts, presets, --hw-* variables
    sample.ts             sample data for the preview
    worker.ts             connecting to a Worker, token help texts
    widget.ts             loading widget.js
    catalog.ts            the 16 widget types, per-platform paste steps
  templates/*.html        one starter per widget type, plus _base.css
  assets/dummy.json       sample data (npm run sync-sample)
```

## Templates

Each file in `src/templates/` starts with a header that describes the widget and its options:

```html
<!--hw {"name":"Amenities","blurb":"…","height":480,"options":[
 {"key":"heading","label":"Heading","type":"text","default":"What this place offers"},
 {"key":"amenities-limit","label":"Show at most","type":"number","default":"10","target":"attr"}
]} -->
```

- Options without a `target` are applied by the builder: `[[key]]` inserts the value (escaped), `[[#key]]…[[/key]]` keeps a block when the option is on, `[[^key]]…[[/key]]` when it's off, `[[#key=value]]…[[/key=value]]` when it equals a value. `[[card]]` is the card style from the Style panel.
- Options with `"target":"attr"` become `data-hosp-<key>` attributes in the snippet, applied by `widget.js` in the browser.
- Option types: `text`, `textarea`, `url` (https only), `pattern` (a URL that may contain `{id}`), `number`, `select`, `toggle`, `reviews` (a review picker).
- The rest is `widget.js` template syntax (see the kit's README). Inside tables, wrap tags in comments (`<!--{#rows}-->`): the browser moves bare text out of tables. A test checks this.
- New starter? Drop the file in `src/templates/` and add the type to `lib/catalog.ts` and `types.ts`; `npm run e2e` will cover it.
