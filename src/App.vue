<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import TopBar from './components/TopBar.vue';
import DesignStep from './components/design/DesignStep.vue';
import DeployStep from './components/DeployStep.vue';
import ConnectStep from './components/ConnectStep.vue';
import CopyStep from './components/CopyStep.vue';
import PreviewStage from './components/PreviewStage.vue';
import { useToast } from './composables/useToast';
import { STORE_KEY, connect, runtime, state } from './stores/builder';
import { loadWidget } from './lib/widget';
import { loadStarters } from './lib/templates';
import { config } from './config';

const { message } = useToast();
const startError = ref('');
const panel = ref<HTMLElement>();

onMounted(async () => {
  try {
    await loadWidget();
    await loadStarters();
    runtime.ready = true;
  } catch (err) {
    startError.value = err instanceof Error ? err.message : String(err);
    return;
  }
  // Coming back from Cloudflare: the Worker's home page sends ?worker=<its address>.
  const fromWorker = new URLSearchParams(location.search).get('worker');
  if (fromWorker) {
    history.replaceState(null, '', location.pathname + location.hash);
    state.step = 'connect';
    await connect(fromWorker);
  } else if (state.worker) {
    await connect(state.worker);
  }
});

// The Worker's link opens the builder in a new tab. When that tab connects,
// this one hears about it through localStorage and connects too.
function onStorage(e: StorageEvent) {
  if (e.key !== STORE_KEY || !e.newValue || !runtime.ready) return;
  try {
    const worker = (JSON.parse(e.newValue) as { worker?: string }).worker;
    if (worker && worker !== runtime.connection?.worker) {
      state.step = 'connect';
      connect(worker);
    }
  } catch {
    /* not ours to read */
  }
}
window.addEventListener('storage', onStorage);
onBeforeUnmount(() => window.removeEventListener('storage', onStorage));

function onStep() {
  panel.value?.scrollTo({ top: 0 });
}
</script>

<template>
  <TopBar @step="onStep" />
  <div v-if="runtime.ready" class="app">
    <aside ref="panel" class="panel">
      <DesignStep v-if="state.step === 'design'" />
      <DeployStep v-else-if="state.step === 'deploy'" />
      <ConnectStep v-else-if="state.step === 'connect'" />
      <CopyStep v-else />
    </aside>
    <PreviewStage />
  </div>
  <div v-else-if="!startError" class="loading" role="status">Loading the widget designs…</div>
  <div v-if="startError" class="fatal callout bad">
    <h3>The builder could not start</h3>
    <p>{{ startError }}</p>
    <p class="small">It loads <code>{{ config.previewWidgetSrc }}</code>. In development, run the kit next to this folder or set <code>KIT_DIR</code>.</p>
  </div>
  <div class="toast" :class="{ show: message }" role="status" aria-live="polite">{{ message }}</div>
</template>

<style scoped>
.loading { display: grid; place-items: center; height: calc(100vh - 60px); color: var(--muted); }
.fatal { position: fixed; left: 50%; top: 90px; transform: translateX(-50%); max-width: 520px; z-index: 60; box-shadow: var(--shadow); }
</style>
