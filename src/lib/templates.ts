// The starter templates live in the kit (widget/templates/*.html) and load
// through its templates module, next to widget.js: the builder renders them
// with exactly the code websites use. Nothing here is a second copy.

import { shallowReactive } from 'vue';
import type { StarterTemplate, TemplateMeta, WidgetType } from '@/types';
import { WIDGET_TYPES } from './catalog';
import { W } from './widget';

/** [label, CSS font stack (null: the website's own), Google Fonts family] */
type Font = [string, string | null, string?];

export interface TemplatesModule {
  FONTS: Record<string, Font>;
  STYLE: Record<string, string>;
  load(type: string): Promise<StarterTemplate>;
  baseCss(): Promise<string>;
  isOn(v: unknown): boolean;
  values(meta: TemplateMeta, chosen: Record<string, string>): Record<string, string>;
  applyOptions(body: string, values: Record<string, string>, meta: TemplateMeta): string;
  styleCss(style: Record<string, unknown>): string;
  fontHref(style: Record<string, unknown>): string;
  useFonts(style: Record<string, unknown>): void;
  render(starter: StarterTemplate, options: Record<string, string>, style: Record<string, unknown>, baseCss: string): string;
  writeParams(obj: Record<string, string>): string;
}

export const T = (): TemplatesModule => W().module('templates') as TemplatesModule;

/** Filled by loadStarters() before the builder shows anything. */
export const STARTERS = shallowReactive({}) as Record<WidgetType, StarterTemplate>;
export const base = { css: '' };

export async function loadStarters(): Promise<void> {
  const [css, ...starters] = await Promise.all([T().baseCss(), ...WIDGET_TYPES.map((t) => T().load(t.id))]);
  base.css = css;
  WIDGET_TYPES.forEach((t, i) => (STARTERS[t.id] = starters[i]));
}

export const isOn = (v: unknown): boolean => v !== undefined && v !== null && !['', 'off', '0', 'false'].includes(String(v));

export function isHttpsUrl(v: string): boolean {
  return /^https:\/\/[^\s"'<>]+\.[^\s"'<>]+$/.test(v.trim());
}

/** Display choices that go into the snippet as data-hosp-* attributes. */
export function attrOptions(meta: TemplateMeta, values: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const o of meta.options) {
    if (o.target !== 'attr') continue;
    const v = String(values[o.key] ?? '').trim();
    if (v === '' || v === '{}' || (o.type === 'number' && Number(v) === 0) || (o.key === 'min-rating' && v === '0')) continue;
    out[o.key] = v;
  }
  return out;
}

/** The template options the host changed from their defaults, for data-hosp-options. */
export function changedOptions(meta: TemplateMeta, chosen: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const o of meta.options) {
    if (o.target === 'attr' || !(o.key in chosen)) continue;
    if (String(chosen[o.key]) !== String(o.default ?? '')) out[o.key] = String(chosen[o.key]);
  }
  return out;
}

/** The same display choices in the camelCase form widget.js reads from data-hosp-* attributes. */
export function displayOptions(attrs: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(attrs).map(([k, v]) => [k.replace(/-([a-z])/g, (_m, c: string) => c.toUpperCase()), v]));
}
