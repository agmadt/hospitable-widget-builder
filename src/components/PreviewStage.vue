<script setup lang="ts">
import { computed, watchEffect } from 'vue';
import WidgetPreview from './WidgetPreview.vue';
import type { Device, GuestView } from '@/types';
import { sampleProperties, sampleStay } from '@/lib/sample';
import { guestWidget, previewData, previewOptions, runtime, selectedProperty, state, template } from '@/stores/builder';
import { T } from '@/lib/templates';

const DEVICES: { id: Device; label: string; icon: string }[] = [
  { id: 'desktop', label: 'Desktop', icon: '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M8 20h8M12 16v4"/>' },
  { id: 'tablet', label: 'Tablet', icon: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M11 18h2"/>' },
  { id: 'phone', label: 'Phone', icon: '<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/>' },
];

const GUEST_VIEWS: { id: GuestView; label: string }[] = [
  { id: 'out', label: 'Signed out' },
  { id: 'early', label: 'Weeks before' },
  { id: 'arrival', label: 'Arrival day' },
];

const previewState = computed(() => runtime.source);
// The embed's height is the signed-in guest's, the tallest view.
const measureData = computed(() => (guestWidget.value ? sampleStay('arrival') : undefined));

// Web fonts live in the document: a font declared inside a shadow root isn't applied.
watchEffect(() => {
  if (runtime.ready) T().useFonts({ ...state.style });
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
        <template v-if="guestWidget">
          <span class="badge sample">Sample stay</span>
          <div class="seg small" role="radiogroup" aria-label="Guest">
            <button v-for="v in GUEST_VIEWS" :key="v.id" type="button" :data-view="v.id" :aria-pressed="state.guestView === v.id" @click="state.guestView = v.id">{{ v.label }}</button>
          </div>
        </template>
        <template v-else-if="runtime.source === 'sample'">
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
        <!-- Signing in or out in the preview flips the sample guest. -->
        <div class="page" :class="{ dark: state.dark }" @hosp:signin="state.guestView = 'arrival'" @hosp:signout="state.guestView = 'out'">
          <div class="page-ghost" aria-hidden="true"><b /><i /><i /></div>
          <WidgetPreview
            :template="template"
            :data="previewData"
            :measure-data="measureData"
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
