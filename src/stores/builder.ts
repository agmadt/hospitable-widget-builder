// The builder's state, shared by every component. What the host designs is
// saved in localStorage, so returning from Cloudflare keeps everything.

import { computed, reactive, shallowRef, watch } from 'vue';
import type { CodeKind, Connection, Dataset, Design, Device, GuestView, Platform, PreviewSource, Step, WidgetData, WidgetStyle, WidgetType } from '@/types';
import { STARTERS, T, attrOptions, base, changedOptions, displayOptions } from '@/lib/templates';
import { DEFAULT_STYLE, PRESETS, changedStyle } from '@/lib/style';
import { WIDGET_TYPES, isGuestType } from '@/lib/catalog';
import { asParsed } from '@/lib/html';
import { sampleData, sampleProperties, sampleStay } from '@/lib/sample';
import { connectWorker, normalizeWorker, type ConnectResult } from '@/lib/worker';
import { W } from '@/lib/widget';
import { config } from '@/config';

export const STORE_KEY = 'hw-builder-v1';

interface Persisted {
  type: WidgetType;
  style: WidgetStyle;
  designs: Partial<Record<WidgetType, Design>>;
  worker: string;
  property: string;
  step: Step;
  device: Device;
  dark: boolean;
  sampleProperty: string;
  platform: Platform;
  guestView: GuestView;
  codeKind: CodeKind;
}

function load(): Persisted {
  let saved: Partial<Persisted> = {};
  try {
    saved = JSON.parse(localStorage.getItem(STORE_KEY) || '{}') as Partial<Persisted>;
  } catch {
    /* private mode or bad JSON: start fresh */
  }
  return {
    type: saved.type && WIDGET_TYPES.some((t) => t.id === saved.type) ? saved.type : 'description',
    style: { ...DEFAULT_STYLE, ...saved.style },
    designs: saved.designs ?? {},
    worker: saved.worker ?? '',
    property: saved.property ?? '',
    step: saved.step ?? 'design',
    device: saved.device ?? 'desktop',
    dark: saved.dark ?? false,
    sampleProperty: saved.sampleProperty || sampleProperties[0].id,
    platform: saved.platform ?? 'wix',
    guestView: saved.guestView ?? 'arrival',
    codeKind: saved.codeKind ?? 'snippet',
  };
}

export const state = reactive<Persisted>(load());

let saveTimer: ReturnType<typeof setTimeout> | undefined;
watch(
  state,
  () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(state));
      } catch {
        /* the builder still works, it just forgets */
      }
    }, 150);
  },
  { deep: true },
);

/** Things that are not saved: the live connection and what the preview shows. */
export const runtime = reactive({
  ready: false,
  connection: null as Connection | null,
  connecting: false,
  lastConnect: null as ConnectResult | null,
  source: 'sample' as PreviewSource,
  dataError: '',
  heights: null as { desktop: number; mobile: number } | null,
});

/** Data in the preview. A shallow ref: it is replaced whole, never mutated. */
export const previewData = shallowRef<WidgetData>({});

// --- Design -----------------------------------------------------------------------

export const starter = computed(() => STARTERS[state.type]);

function ensureDesign(type: WidgetType): Design {
  return (state.designs[type] ??= { options: {}, custom: null, uid: Math.random().toString(36).slice(2, 6) });
}

// Every widget type gets its saved design the moment it is picked.
watch(() => state.type, ensureDesign, { immediate: true, flush: 'sync' });

export const design = computed(() => state.designs[state.type] ?? ensureDesign(state.type));

/** Every option of the current widget, with defaults, plus the card style. */
export const optionValues = computed<Record<string, string>>(() => ({ ...T().values(starter.value.meta, design.value.options), card: state.style.card }));

export const attrs = computed(() => attrOptions(starter.value.meta, optionValues.value));
export const previewOptions = computed(() => displayOptions(attrs.value));

/** The template body: the host's own HTML, or the starter with options applied. */
export const body = computed(() => design.value.custom ?? T().applyOptions(starter.value.body, optionValues.value, starter.value.meta));

/**
 * The full template, as the browser parses it: what widget.js renders for a
 * snippet that names this starter, or what a custom snippet's <template> holds.
 */
export const template = computed(() => asParsed(`<style>${T().styleCss(state.style)}\n${base.css}</style>\n${body.value}`));

/** What the snippet records: only what the host changed from the defaults. */
export const snippetOptions = computed(() => T().writeParams(changedOptions(starter.value.meta, design.value.options)));
export const snippetStyle = computed(() => T().writeParams(changedStyle(state.style)));

export const datasets = computed<Dataset[]>(() => (runtime.ready ? W().analyze(template.value).datasets : ['property']));

/** Widgets like Property list and Meet your host need no property ID; a guest's widgets find theirs from the booking. */
export const needsProperty = computed(() => datasets.value.some((d) => d !== 'host' && d !== 'properties' && d !== 'stay'));

/** A widget for signed-in guests: previewed with a sample stay, copied as an iframe. */
export const guestWidget = computed(() => isGuestType(state.type));

/** What the Copy step hands over: guest widgets only work as an iframe. */
export const codeKind = computed<CodeKind>(() => (guestWidget.value ? 'iframe' : state.codeKind));

export function setOption(key: string, value: string) {
  design.value.options[key] = value;
}

export function setCustom(html: string | null) {
  design.value.custom = html;
}

export function applyPreset(index: number) {
  Object.assign(state.style, PRESETS[index].style);
}

// --- Connection ------------------------------------------------------------------------

/** The public demo Worker (sample data): every step works without deploying anything. */
export async function tryDemo() {
  state.step = 'connect';
  await connect(config.demoWorker);
}

export const onDemo = computed(() => !!config.demoWorker && runtime.connection?.worker === normalizeWorker(config.demoWorker));

export async function connect(input: string): Promise<ConnectResult | null> {
  const worker = normalizeWorker(input);
  if (!worker) {
    runtime.lastConnect = null;
    return null;
  }
  runtime.connecting = true;
  const result = await connectWorker(worker);
  runtime.connecting = false;
  runtime.lastConnect = result;
  if (result.ok) {
    state.worker = worker;
    runtime.connection = result.connection;
    const props = result.connection.properties;
    if (!props.some((p) => p.id === state.property)) state.property = props[0]?.id ?? '';
  } else {
    runtime.connection = null;
  }
  return result;
}

export const selectedProperty = computed(() => runtime.connection?.properties.find((p) => p.id === state.property) ?? null);

export const stepDone = computed<Record<Step, boolean>>(() => ({
  design: true,
  deploy: !!runtime.connection,
  connect: !!runtime.connection && (!!selectedProperty.value || !needsProperty.value),
  copy: false,
}));

// --- Preview data ----------------------------------------------------------------------

let loadSeq = 0;

async function loadPreviewData() {
  if (!runtime.ready) return;
  const seq = ++loadSeq;
  const sets = datasets.value;
  const conn = runtime.connection;
  // Nobody signs in to the builder, so a guest's widgets always preview a sample stay.
  if (sets.includes('stay')) {
    previewData.value = sampleStay(state.guestView);
    runtime.source = 'sample';
    runtime.dataError = '';
    return;
  }
  const canUseWorker = conn && (selectedProperty.value || !needsProperty.value);
  if (!canUseWorker) {
    previewData.value = sampleData(state.sampleProperty, sets);
    runtime.source = 'sample';
    runtime.dataError = '';
    return;
  }
  try {
    const data = await W().fetchData(conn.worker, selectedProperty.value?.id ?? null, sets);
    if (seq !== loadSeq) return;
    previewData.value = data;
    runtime.source = data.sample_data ? 'dummy' : 'live';
    runtime.dataError = '';
  } catch (err) {
    if (seq !== loadSeq) return;
    previewData.value = sampleData(state.sampleProperty, sets);
    runtime.source = 'sample';
    runtime.dataError = err instanceof Error ? err.message : String(err);
  }
}

watch(
  () => [runtime.ready, datasets.value.join(), runtime.connection, state.property, state.sampleProperty, state.guestView],
  loadPreviewData,
  { immediate: true },
);
