<script setup lang="ts">
import { computed, ref } from 'vue';
import Callout from './ui/Callout.vue';
import { useSnippet } from '@/composables/useSnippet';
import { highlight } from '@/lib/html';
import { copyText } from '@/lib/clipboard';
import { testPage } from '@/lib/snippet';
import { PLATFORMS } from '@/lib/catalog';
import { cachePeriod } from '@/lib/worker';
import { config } from '@/config';
import { body, design, runtime, state } from '@/stores/builder';
import { useWeight } from '@/composables/useWeight';

const { snippet, build } = useSnippet();
const weight = useWeight();
const kb = (bytes: number) => `${(bytes / 1024).toFixed(1)} KB`;
const copied = ref(false);

const size = computed(() => (snippet.value ? (new Blob([snippet.value]).size / 1024).toFixed(1) : '0'));
const platform = computed(() => PLATFORMS.find((p) => p.id === state.platform) ?? PLATFORMS[0]);
// Read more and accordions grow when opened; a fixed-height embed can't.
const grows = computed(() => /data-grows|<details|d-more/.test(body.value));

async function copy() {
  if (!snippet.value) return;
  await copyText(snippet.value);
  copied.value = true;
  setTimeout(() => (copied.value = false), 1600);
}

function blobUrl(html: string) {
  return URL.createObjectURL(new Blob([html], { type: 'text/html' }));
}

function openTest() {
  // Blob pages can't resolve "/widget.js", so give the preview's copy as a full URL.
  const code = build(new URL(config.previewWidgetSrc, location.href).href);
  if (code) window.open(blobUrl(testPage(code, runtime.connection!.worker, state.dark)), '_blank', 'noopener');
}

function download() {
  if (!snippet.value) return;
  const a = document.createElement('a');
  a.href = blobUrl(testPage(snippet.value, runtime.connection!.worker, state.dark));
  a.download = `${state.type}-widget.html`;
  a.click();
}
</script>

<template>
  <section class="pane">
    <div class="pane-head">
      <h1>Copy your snippet</h1>
      <p>Paste it into an <b>Embed HTML</b> element on your website. That's the last step: your widget updates itself from now on.</p>
    </div>

    <Callout v-if="!runtime.connection" kind="warn" title="Connect your Worker first">
      <p>
        The snippet loads data from your own Worker, so it needs its address.
        <button class="link" type="button" @click="state.step = 'deploy'">Deploy one</button> or
        <button class="link" type="button" @click="state.step = 'connect'">connect it</button>.
      </p>
    </Callout>

    <div v-else>
      <div class="snippet-bar">
        <button class="btn primary" :class="{ ok: copied }" type="button" @click="copy">{{ copied ? 'Copied ✓' : 'Copy snippet' }}</button>
        <button class="btn ghost" type="button" title="Opens the snippet on its own page, as a website would show it" @click="openTest">Open test page</button>
        <button class="btn ghost" type="button" @click="download">Download .html</button>
      </div>
      <div v-if="runtime.heights" class="height-tip">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18M8 7l4-4 4 4M8 17l4 4 4-4" /></svg>
        <span>
          Set the embed's height to about <b>{{ runtime.heights.desktop }} px</b> on desktop and <b>{{ runtime.heights.mobile }} px</b> on mobile.
          <template v-if="grows"> Sections that open (Read more, accordions) need extra room, because embeds on Wix do not grow.</template>
        </span>
      </div>
      <div v-if="weight" class="weight" aria-label="What this widget costs a website">
        <div>
          <b>{{ weight.total !== null ? kb(weight.total) : '…' }}</b>
          <span>JavaScript, cached by jsDelivr</span>
          <small>{{ weight.files.map((f) => (f.size ? `${f.name} ${kb(f.size)}` : f.name)).join(' + ') }}</small>
        </div>
        <div>
          <b>{{ weight.requests }}</b>
          <span>request{{ weight.requests === 1 ? '' : 's' }} to your Worker per visitor {{ cachePeriod(runtime.connection.cacheMinutes) }}</span>
          <small>shared with your other widgets for this property</small>
        </div>
      </div>
      <pre id="snippet" class="snippet" tabindex="0" aria-label="Your snippet" v-html="highlight(snippet ?? '')" />
      <p class="muted small">
        <template v-if="design.custom === null">One element and one script: the design loads from jsDelivr, the data from your Worker.</template>
        <template v-else>{{ size }} KB: your own HTML travels in the snippet.</template>
        Visitors' browsers keep the last data, so returning visitors still see the widget if your Worker can't be reached.
        <template v-if="runtime.connection.mode === 'dummy'">This snippet shows sample data until your Worker has a real token.</template>
      </p>
    </div>

    <div class="guides">
      <h2>Add it to your website</h2>
      <div class="guide-tabs" role="tablist">
        <button v-for="p in PLATFORMS" :key="p.id" role="tab" type="button" :aria-selected="p.id === state.platform" @click="state.platform = p.id">{{ p.label }}</button>
      </div>
      <ol class="guide-body"><li v-for="s in platform.steps" :key="s" v-html="s" /></ol>
    </div>
    <p class="hint">Changed your design later? Come back, adjust it, and copy a new snippet. Changes to your listing in Hospitable show up on their own within an hour.</p>
  </section>
</template>

<style scoped>
.weight { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px; }
.weight > div { padding: 10px 12px; border-radius: 10px; background: var(--line-2); display: grid; gap: 1px; }
.weight b { font-size: 18px; letter-spacing: -.01em; }
.weight span { font-size: 12.5px; color: var(--ink-2); }
.weight small { font-size: 11.5px; color: var(--muted); }
</style>
