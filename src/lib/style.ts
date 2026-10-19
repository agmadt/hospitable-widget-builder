import type { WidgetStyle } from '@/types';

export interface Font {
  label: string;
  stack: string;
  /** Google Fonts family spec, when the font has to be loaded. */
  google?: string;
}

export const FONTS: Record<string, Font> = {
  system: { label: 'System (matches most sites)', stack: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' },
  inter: { label: 'Inter', stack: 'Inter, ui-sans-serif, system-ui, sans-serif', google: 'Inter:wght@400;600;700' },
  'dm-sans': { label: 'DM Sans', stack: '"DM Sans", ui-sans-serif, system-ui, sans-serif', google: 'DM+Sans:wght@400;600;700' },
  poppins: { label: 'Poppins', stack: 'Poppins, ui-sans-serif, system-ui, sans-serif', google: 'Poppins:wght@400;600;700' },
  montserrat: { label: 'Montserrat', stack: 'Montserrat, ui-sans-serif, system-ui, sans-serif', google: 'Montserrat:wght@400;600;700' },
  nunito: { label: 'Nunito', stack: 'Nunito, ui-sans-serif, system-ui, sans-serif', google: 'Nunito:wght@400;600;700' },
  lora: { label: 'Lora (serif)', stack: 'Lora, Georgia, serif', google: 'Lora:wght@400;600;700' },
  playfair: { label: 'Playfair Display (serif)', stack: '"Playfair Display", Georgia, serif', google: 'Playfair+Display:wght@500;600;700' },
  cormorant: { label: 'Cormorant Garamond (serif)', stack: '"Cormorant Garamond", Georgia, serif', google: 'Cormorant+Garamond:wght@500;600;700' },
  georgia: { label: 'Georgia (serif)', stack: 'Georgia, "Times New Roman", serif' },
};

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

/** Black or white, whichever reads better on the accent color. */
export function onAccent(hex: string): string {
  const n = parseInt(String(hex).replace('#', ''), 16);
  if (Number.isNaN(n)) return '#ffffff';
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.45 ? '#111111' : '#ffffff';
}

/** The --hw-* variables every starter template reads. */
export function styleCss(s: WidgetStyle): string {
  const font = FONTS[s.font] ?? FONTS.system;
  const heading = s.headingFont === 'same' ? font : FONTS[s.headingFont] ?? font;
  return `:host{--hw-accent:${s.accent};--hw-text:${s.text};--hw-bg:${s.background};--hw-font:${font.stack};--hw-heading-font:${heading.stack};--hw-radius:${Number(s.radius)}px;--hw-space:${Number(s.space)}px;--hw-on-accent:${onAccent(s.accent)}}`;
}

/** Google Fonts stylesheet for the chosen fonts, or "" when none is needed. */
export function fontLink(s: WidgetStyle): string {
  const families = new Set<string>();
  const add = (key: string) => FONTS[key]?.google && families.add(FONTS[key].google!);
  add(s.font);
  if (s.headingFont !== 'same') add(s.headingFont);
  if (!families.size) return '';
  return `https://fonts.googleapis.com/css2?${[...families].map((f) => `family=${f}`).join('&')}&display=swap`;
}
