import type { Dataset, HospWidgets, WidgetModule, WidgetType } from '@/types';
import { compact, escapeHtml } from './html';

export interface SnippetInput {
  /** widget.js API, for working out what the widget needs. */
  hosp: HospWidgets;
  type: WidgetType;
  /** The template as the preview renders it (style, CSS and body). */
  template: string;
  /** The host's own HTML when they edited it; null for a starter template. */
  custom: string | null;
  /** Unique id for a custom template on the page. */
  id: string;
  worker: string;
  property: string;
  /** Template options and style the host changed from the defaults. */
  options: string;
  style: string;
  /** data-hosp-* display choices, kebab-case keys. */
  attrs: Record<string, string>;
  /** Google Fonts stylesheet, needed only for custom HTML. */
  fontHref: string;
  widgetSrc: string;
}

/** What a widget needs: data sets from the Worker and modules next to widget.js. */
export function needs(hosp: HospWidgets, template: string): { datasets: Dataset[]; modules: WidgetModule[]; requests: number } {
  const datasets = hosp.analyze(template).datasets;
  const modules = hosp.plan(template, datasets);
  // widget.js folds every per-property set into one request (?include=).
  const requests = (datasets.includes('property') || datasets.includes('host') ? 1 : 0) + (datasets.includes('properties') ? 1 : 0);
  return { datasets, modules, requests };
}

/**
 * One <div> and one <script>. A starter template is named by type and loads
 * from next to widget.js; only HTML the host edited by hand rides along in a
 * <template>.
 */
export function buildSnippet(i: SnippetInput): string {
  const { datasets, modules } = needs(i.hosp, i.template);
  const attr = (name: string, value: string) => ` ${name}="${escapeHtml(value)}"`;
  let div = i.custom === null ? attr('data-hosp', i.type) : attr('data-hosp-template', i.id);
  div += attr('data-hosp-worker', i.worker);
  if (i.property || datasets.some((s) => s !== 'host' && s !== 'properties')) div += attr('data-hosp-property', i.property);
  // Saying what the widget needs lets widget.js fetch its data straight away.
  div += attr('data-hosp-data', datasets.join(',')) + attr('data-hosp-modules', modules.filter((m) => m !== 'templates').join(','));
  if (i.custom === null && i.options) div += attr('data-hosp-options', i.options);
  if (i.custom === null && i.style) div += attr('data-hosp-style', i.style);
  for (const [k, v] of Object.entries(i.attrs)) div += attr(`data-hosp-${k}`, v);

  const lines = [];
  if (i.custom !== null) {
    if (i.fontHref) lines.push(`<link rel="stylesheet" href="${escapeHtml(i.fontHref)}">`);
    lines.push(`<template id="${i.id}">`, compact(i.template), '</template>');
  }
  lines.push(`<div${div}></div>`, `<script src="${escapeHtml(i.widgetSrc)}" defer></script>`);
  return lines.join('\n');
}

/** A page that shows the snippet the way a website would. */
export function testPage(snippet: string, worker: string, dark = false): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Widget test page</title>
<style>body{margin:0;background:${dark ? '#0c0a09' : '#f5f5f4'};font:15px/1.5 system-ui,sans-serif;color:#57534e}.wrap{max-width:1000px;margin:0 auto;padding:32px 16px}.note{font-size:13px;margin:0 0 20px}</style></head>
<body><div class="wrap"><p class="note">This page shows your snippet exactly as a website would. Data comes live from <b>${escapeHtml(worker)}</b>.</p>
${snippet}
</div></body></html>`;
}
