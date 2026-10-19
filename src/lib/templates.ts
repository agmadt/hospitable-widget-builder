// Starter templates live in src/templates/<type>.html. Each starts with a
// header, <!--hw {...} -->, describing the widget and its options. Options
// without a target are applied here, before the template reaches widget.js:
//   [[key]]                     the value, escaped
//   [[#key]]…[[/key]]           kept when the option is on
//   [[^key]]…[[/key]]           kept when it is off
//   [[#key=value]]…[[/key=value]]  kept when it equals value

import type { StarterTemplate, TemplateMeta, TemplateOption, WidgetType } from '@/types';
import { escapeHtml } from './html';

const files = import.meta.glob<string>('../templates/*.html', { query: '?raw', import: 'default', eager: true });
const css = import.meta.glob<string>('../templates/_base.css', { query: '?raw', import: 'default', eager: true });

export function parseTemplate(text: string): StarterTemplate {
  const m = /^\s*<!--hw\s*([\s\S]*?)-->\s*/.exec(text);
  if (!m) return { meta: { name: 'Widget', options: [] }, body: text };
  return { meta: JSON.parse(m[1]) as TemplateMeta, body: text.slice(m[0].length).trim() };
}

export const STARTERS: Record<WidgetType, StarterTemplate> = Object.fromEntries(
  Object.entries(files).map(([path, text]) => [path.replace(/^.*\/(.+)\.html$/, '$1'), parseTemplate(text)]),
) as Record<WidgetType, StarterTemplate>;

/** Shared widget CSS, minified to one line. */
export const BASE_CSS = (Object.values(css)[0] || '').replace(/\s*\n\s*/g, '');

export const isOn = (v: unknown): boolean => v !== undefined && v !== null && !['', 'off', '0', 'false'].includes(String(v));

/** Option values with every default filled in. */
export function defaults(meta: TemplateMeta, overrides: Record<string, string> = {}): Record<string, string> {
  const values: Record<string, string> = {};
  for (const o of meta.options) values[o.key] = o.default ?? '';
  return { ...values, ...overrides };
}

export function applyOptions(body: string, values: Record<string, string>, meta?: TemplateMeta): string {
  const options = Object.fromEntries((meta?.options ?? []).map((o) => [o.key, o]));
  const section = /\[\[([#^])([\w-]+)(?:=([\w-]+))?\]\]([\s\S]*?)\[\[\/\2(?:=\3)?\]\]/g;
  let out = body;
  // Sections can nest; each pass resolves the outermost ones.
  for (let pass = 0; pass < 20 && /\[\[[#^]/.test(out); pass++) {
    out = out.replace(section, (_all, sigil: string, key: string, eq: string | undefined, inner: string) => {
      const on = eq !== undefined ? String(values[key]) === eq : isOn(values[key]);
      return (sigil === '#') === on ? inner : '';
    });
  }
  return out.replace(/\[\[([\w-]+)\]\]/g, (_all, key: string) => optionText(values[key], options[key]?.type, options[key]?.tokens));
}

export function optionText(value: unknown, type?: TemplateOption['type'], tokens: Record<string, string> = {}): string {
  const v = String(value ?? '').trim();
  if (type === 'url') return isHttpsUrl(v) ? escapeHtml(v) : '#';
  // A pattern may contain {id}, which widget.js fills in per property.
  if (type === 'pattern') return /^https:\/\/[^\s"'<>]+$/.test(v) ? v.replace(/"/g, '%22') : '#';
  // Typed text must not turn into template tags. Entities would not help: the
  // browser decodes them when it parses the snippet, so a zero-width space
  // after "{" keeps "{name}" from looking like a tag.
  // The option's own tokens ({count}) become real template tags.
  return escapeHtml(String(value ?? '')).replace(/\{(\w+)\}|\{|\[\[/g, (m: string, name?: string) => {
    if (name && tokens[name]) return `{${tokens[name]}}`;
    return m === '[[' ? '[\u200B[' : `{\u200B${m.slice(1)}`;
  });
}

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

/** The same choices in the camelCase form widget.js reads from data-hosp-* attributes. */
export function displayOptions(attrs: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(attrs).map(([k, v]) => [k.replace(/-([a-z])/g, (_m, c: string) => c.toUpperCase()), v]));
}
