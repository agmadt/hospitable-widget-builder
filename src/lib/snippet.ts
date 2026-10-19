import type { Dataset, HospWidgets, WidgetData, WidgetModule } from '@/types';
import { compact, escapeHtml, scriptJson } from './html';
import { propertyFields } from './sample';

export interface SnippetInput {
  /** widget.js API, for working out data sets and the smallest snapshot. */
  hosp: HospWidgets;
  id: string;
  name: string;
  /** The compiled template: style block, base CSS and body, as parsed by the browser. */
  template: string;
  /** The data the preview shows; becomes the fallback snapshot. */
  data: WidgetData;
  worker: string;
  property: string;
  /** data-hosp-* display choices, kebab-case keys. */
  attrs: Record<string, string>;
  displayOptions: Record<string, string>;
  fontHref: string;
  widgetSrc: string;
  sampleMode: boolean;
  credit?: string;
}

/** What a widget needs: data sets from the Worker and modules next to widget.js. */
export function needs(hosp: HospWidgets, template: string): { datasets: Dataset[]; modules: WidgetModule[]; requests: number } {
  const datasets = hosp.analyze(template).datasets;
  const modules = hosp.plan(template, datasets);
  // widget.js folds every per-property set into one request (?include=).
  const requests = (datasets.includes('property') || datasets.includes('host') ? 1 : 0) + (datasets.includes('properties') ? 1 : 0);
  return { datasets, modules, requests };
}

export function buildSnippet(i: SnippetInput): string {
  const { datasets, modules } = needs(i.hosp, i.template);
  const needsProperty = datasets.some((s) => s !== 'host' && s !== 'properties');
  const fallback = snapshot(i, datasets);
  // Saying what the widget needs up front saves widget.js working it out.
  const attrs = [` data-hosp-data="${datasets.join(',')}" data-hosp-modules="${modules.join(',')}"`]
    .concat(Object.entries(i.attrs).map(([k, v]) => ` data-hosp-${k}="${escapeHtml(v)}"`))
    .join('');
  return [
    `<!-- Hospitable listing widget: ${i.name}${i.credit ? `. Made with ${i.credit}` : ''} -->`,
    // Opens the connection to the Worker while widget.js is still loading.
    `<link rel="preconnect" href="${escapeHtml(i.worker)}" crossorigin>`,
    i.fontHref ? `<link rel="stylesheet" href="${escapeHtml(i.fontHref)}">` : '',
    `<template id="${i.id}">`,
    compact(i.template),
    `</template>`,
    `<script type="application/json" id="${i.id}-fallback">${scriptJson(fallback)}</script>`,
    `<div data-hosp-template="${i.id}" data-hosp-worker="${escapeHtml(i.worker)}"${needsProperty ? ` data-hosp-property="${escapeHtml(i.property)}"` : ''}${attrs}></div>`,
    `<script src="${escapeHtml(i.widgetSrc)}" defer></script>`,
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * The fallback snapshot: today's data, shown when the Worker can't be reached.
 * Only the data sets the template uses, trimmed, then cut down to the fields
 * that actually change what renders.
 */
export function snapshot(i: Pick<SnippetInput, 'hosp' | 'template' | 'data' | 'attrs' | 'displayOptions' | 'sampleMode'>, datasets: Dataset[]): WidgetData {
  const d = i.data;
  const keep: WidgetData = {};
  const pick = (keys: string[]) => keys.forEach((k) => d[k] !== undefined && (keep[k] = d[k]));
  const sets = new Set(datasets);
  if (sets.has('property')) pick([...propertyFields, 'photos', 'updated_at']);
  if (sets.has('calendar')) {
    keep.currency = d.currency;
    // Three months is plenty to fall back on; old availability should not linger.
    keep.calendar = ((d.calendar as unknown[]) || []).slice(0, 92);
  }
  if (sets.has('reviews')) {
    const ids = String(i.attrs['review-ids'] || '').split(',').filter(Boolean);
    const all = (d.reviews as { id: string }[]) || [];
    keep.reviews = ids.length ? all.filter((r) => ids.includes(String(r.id))) : all.slice(0, 24);
    pick(['rating_average', 'review_count']);
  }
  if (sets.has('guide')) pick(['guide']);
  if (sets.has('host')) pick(['host_name', 'host_picture']);
  if (sets.has('properties')) pick(['properties']);
  if (i.sampleMode || d.sample_data) keep.sample_data = true;
  return minimize(keep, (data) => i.hosp.render(i.template, i.hosp.derive(data, i.displayOptions)));
}

/** Drops every field whose removal leaves the rendered output unchanged. */
export function minimize(data: WidgetData, render: (d: WidgetData) => string): WidgetData {
  const full = render(data);
  const out: WidgetData = { ...data };
  for (const key of Object.keys(data)) {
    if (key === 'sample_data') continue;
    const without = { ...out };
    delete without[key];
    if (render(without) === full) delete out[key];
  }
  return out;
}

/** A page that shows the snippet the way a website would. */
export function testPage(snippet: string, worker: string, dark = false): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Widget test page</title>
<style>body{margin:0;background:${dark ? '#0c0a09' : '#f5f5f4'};font:15px/1.5 system-ui,sans-serif;color:#57534e}.wrap{max-width:1000px;margin:0 auto;padding:32px 16px}.note{font-size:13px;margin:0 0 20px}</style></head>
<body><div class="wrap"><p class="note">This page shows your snippet exactly as a website would. Data comes live from <b>${escapeHtml(worker)}</b>.</p>
${snippet}
</div></body></html>`;
}
