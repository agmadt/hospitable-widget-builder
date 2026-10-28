export type Dataset = 'property' | 'calendar' | 'reviews' | 'guide' | 'host' | 'properties' | 'stay';

/** Merged widget data, as the Worker serves it. */
export type WidgetData = Record<string, unknown>;

/** Display choices passed to widget.js (camelCase of data-hosp-* attributes). */
export type DisplayOptions = Record<string, string>;

/** The modules widget.js can load next to itself. Formatting is built in. */
export type WidgetModule = 'analyze' | 'templates' | 'calendar' | 'reviews' | 'lightbox' | 'pager' | 'guest';

/** The API widget.js puts on window.HospWidgets. */
export interface HospWidgets {
  version: string;
  /** Where modules load from: same folder and version as widget.js. */
  base: { dir: string; ext: string };
  render(template: string, data: WidgetData): string;
  renderTo(el: HTMLElement, template: string, data: WidgetData, opts?: DisplayOptions, state?: string): ShadowRoot;
  derive(data: WidgetData, opts?: DisplayOptions): WidgetData;
  /** Needs the analyze module. */
  analyze(template: string): { fields: string[]; datasets: Dataset[] };
  /** Needs the analyze module. */
  plan(template: string, datasets?: Dataset[]): WidgetModule[];
  fetchData(worker: string, propertyId: string | null, datasets: Dataset[]): Promise<WidgetData>;
  need(modules: WidgetModule[]): Promise<unknown[]>;
  module(name: WidgetModule): unknown;
}

declare global {
  interface Window {
    HospWidgets?: HospWidgets;
  }
}

export type OptionType = 'text' | 'textarea' | 'url' | 'pattern' | 'number' | 'select' | 'toggle' | 'reviews' | 'topics';

export interface TemplateOption {
  key: string;
  label: string;
  type: OptionType;
  default?: string;
  /** "attr": becomes a data-hosp-<key> attribute that widget.js applies. Otherwise applied by the builder. */
  target?: 'attr';
  choices?: [string, string][];
  min?: number;
  max?: number;
  /** Help shown under the field. */
  hint?: string;
  /** Words in braces the host may type, mapped to widget fields: {"count": "amenity_count"}. */
  tokens?: Record<string, string>;
}

export interface TemplateMeta {
  name: string;
  blurb?: string;
  height?: number;
  /** Shows a signed-in guest's stay: only works as an embed from the Worker. */
  guest?: boolean;
  options: TemplateOption[];
}

export interface StarterTemplate {
  meta: TemplateMeta;
  body: string;
}

export type WidgetType =
  | 'description' | 'key-facts' | 'amenities' | 'gallery' | 'house-rules' | 'sleeping' | 'space-area' | 'reviews'
  | 'rating-summary' | 'calendar' | 'price-from' | 'policies-fees' | 'local-guide' | 'also-listed-on' | 'meet-host' | 'property-list'
  | 'guest-login' | 'stay-summary' | 'door-code' | 'wifi' | 'getting-there' | 'house-manual' | 'payment' | 'guest-guide';

export type CardStyle = 'card-border' | 'card-shadow' | '';

export interface WidgetStyle {
  accent: string;
  text: string;
  background: string;
  font: string;
  headingFont: string;
  radius: number;
  space: number;
  card: CardStyle;
}

export interface Design {
  options: Record<string, string>;
  /** HTML the host edited by hand; null while the starter template and its options apply. */
  custom: string | null;
  /** Keeps template ids unique when several widgets share a page. */
  uid: string;
}

export type Step = 'design' | 'deploy' | 'connect' | 'copy';
/** What a guest widget's preview shows: before signing in, a stay weeks away, arrival day. */
export type GuestView = 'out' | 'early' | 'arrival';
/** How the Copy step hands over a widget: a snippet, or an iframe of the Worker's embed page. */
export type CodeKind = 'snippet' | 'iframe';
export type Device = 'desktop' | 'tablet' | 'phone';
export type Platform = 'pages' | 'wix' | 'squarespace' | 'wordpress' | 'webflow' | 'other';

export interface PropertySummary {
  id: string;
  property_name: string;
  photo: string | null;
  city: string | null;
  country?: string | null;
  max_guests: number | null;
  bedrooms: number | null;
  currency: string;
  price_from: number | null;
}

export type TokenState = 'ok' | 'rejected' | 'forbidden' | 'missing' | 'unknown';

export interface WorkerStatus {
  token: TokenState;
  last_run: string | null;
  last_success: string | null;
  error: string | null;
  partial: boolean;
}

/** Guest sign-in on a Worker (kit 1.3 and newer). */
export interface GuestStatus {
  on: boolean;
  missing: string[];
  /** Websites allowed to show guest widgets, as written in GUEST_SITES; "*" in dummy mode. */
  sites: string[];
  reveal_hours: number;
}

export interface Connection {
  worker: string;
  /** Null for Workers from before guest sign-in. */
  guest: GuestStatus | null;
  mode: 'live' | 'dummy';
  properties: PropertySummary[];
  status: WorkerStatus | null;
  /** How long visitors' browsers keep the data (the Worker's CACHE_MINUTES). */
  cacheMinutes: number;
}

export type PreviewSource = 'sample' | 'dummy' | 'live';
