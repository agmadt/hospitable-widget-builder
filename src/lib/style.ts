import type { WidgetStyle } from '@/types';

// Fonts, the --hw-* variables and their defaults belong to the kit's templates
// module (see lib/templates.ts). The presets are the builder's own.

export const DEFAULT_STYLE: WidgetStyle = {
  accent: '#0f766e',
  text: '#1c1917',
  background: '#ffffff',
  font: 'system',
  headingFont: 'same',
  radius: 16,
  space: 16,
  card: 'card-border',
};

export const PRESETS: { name: string; style: Partial<WidgetStyle> }[] = [
  { name: 'Lagoon', style: { accent: '#0f766e', text: '#1c1917', background: '#ffffff', font: 'system', headingFont: 'same', card: 'card-border', radius: 16 } },
  { name: 'Garden', style: { accent: '#2e7d32', text: '#1f2a1f', background: '#ffffff', font: 'georgia', headingFont: 'same', card: 'card-border', radius: 12 } },
  { name: 'Terracotta', style: { accent: '#c2410c', text: '#292524', background: '#fffaf5', font: 'dm-sans', headingFont: 'lora', card: '', radius: 18 } },
  { name: 'Coral', style: { accent: '#e11d48', text: '#1f2937', background: '#ffffff', font: 'poppins', headingFont: 'same', card: 'card-shadow', radius: 20 } },
  { name: 'Minimal', style: { accent: '#18181b', text: '#18181b', background: '#ffffff', font: 'inter', headingFont: 'same', card: 'card-border', radius: 4 } },
  { name: 'Midnight', style: { accent: '#fbbf24', text: '#f5f5f4', background: '#1c1917', font: 'inter', headingFont: 'cormorant', card: '', radius: 16 } },
];

/** The style the host changed from the defaults, for data-hosp-style. */
export function changedStyle(s: WidgetStyle): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(s) as [keyof WidgetStyle, unknown][]) {
    if (String(v) !== String(DEFAULT_STYLE[k])) out[k] = String(v);
  }
  return out;
}
