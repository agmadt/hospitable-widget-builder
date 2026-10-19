<script setup lang="ts">
import { computed, watchEffect } from 'vue';
import WidgetPreview from './WidgetPreview.vue';
import type { Device } from '@/types';
import { fontLink } from '@/lib/style';
import { sampleProperties } from '@/lib/sample';
import { previewData, previewOptions, runtime, selectedProperty, state, template } from '@/stores/builder';

const DEVICES: { id: Device; label: string; icon: string }[] = [
  { id: 'desktop', label: 'Desktop', icon: '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M8 20h8M12 16v4"/>' },
  { id: 'tablet', label: 'Tablet', icon: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M11 18h2"/>' },
  { id: 'phone', label: 'Phone', icon: '<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/>' },
];

const previewState = computed(() => runtime.source);

// Web fonts live in the document: a font declared inside a shadow root isn't applied.
const loadedFonts = new Set<string>();
watchEffect(() => {
  const href = fontLink(state.style);
  if (!href || loadedFonts.has(href)) return;
  loadedFonts.add(href);
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
});
</script>

<template>
  <main class="stage" aria-label="Preview">
    <div class="stage-bar">
      <div class="seg" role="radiogroup" aria-label="Preview width">
        <button v-for="d in DEVICES" :key="d.id" type="button" :data-device="d.id" :title="d.label" :aria-pressed="state.device === d.id" @click="state.device = d.id">
          <svg viewBox="0 0 24 24" aria-hidden="true" v-html="d.icon" /><span>{{ d.label }}</span>
        </button>
      </div>
      <div class="data-src">
        <template v-if="runtime.source === 'sample'">
          <span class="badge sample">Sample data</span>
          <select v-model="state.sampleProperty" class="mini" aria-label="Sample property">
            <option v-for="p in sampleProperties" :key="p.id" :value="p.id">{{ p.property_name }}</option>
          </select>
          <span v-if="runtime.dataError" class="muted small" :title="runtime.dataError">· your Worker didn't answer, showing samples</span>
        </template>
        <template v-else>
          <span class="badge" :class="runtime.source === 'dummy' ? 'sample' : 'live'">{{ runtime.source === 'dummy' ? 'Sample data from your Worker' : 'Live data' }}</span>
          <span v-if="selectedProperty" class="muted">{{ selectedProperty.property_name }}</span>
        </template>
      </div>
      <label class="toggle-dark"><input v-model="state.dark" type="checkbox"> <span>Dark page</span></label>
    </div>
    <div class="canvas">
      <div class="browser" :class="state.device">
        <div class="chrome"><i /><i /><i /><span>yourwebsite.com</span></div>
        <div class="page" :class="{ dark: state.dark }">
          <div class="page-ghost" aria-hidden="true"><b /><i /><i /></div>
          <WidgetPreview
            :template="template"
            :data="previewData"
            :options="previewOptions"
            :state="previewState"
            :ready="runtime.ready"
            @heights="runtime.heights = $event"
          />
          <div class="page-ghost" aria-hidden="true"><i /><i /></div>
        </div>
      </div>
    </div>
  </main>
</template>
