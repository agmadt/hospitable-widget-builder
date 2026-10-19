<script setup lang="ts">
import { computed } from 'vue';
import type { Step } from '@/types';
import { runtime, state, stepDone } from '@/stores/builder';

const emit = defineEmits<{ step: [Step] }>();

const STEPS: { id: Step; label: string }[] = [
  { id: 'design', label: 'Design' },
  { id: 'deploy', label: 'Deploy' },
  { id: 'connect', label: 'Connect' },
  { id: 'copy', label: 'Copy' },
];

const status = computed(() => {
  const c = runtime.connection;
  if (c) return c.mode === 'dummy' ? { kind: 'sample', text: 'Worker (sample data)' } : { kind: 'ok', text: 'Worker connected' };
  if (runtime.connecting) return { kind: '', text: 'Connecting…' };
  return state.worker ? { kind: 'bad', text: 'Worker not reachable' } : { kind: '', text: 'No Worker yet' };
});

function go(step: Step) {
  state.step = step;
  emit('step', step);
}
</script>

<template>
  <header class="top">
    <a class="brand" href="./">
      <svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" /><path d="M9 16.5 16 10l7 6.5V23H9z" /></svg>
      <span>Listing Widgets <small>for Hospitable</small></span>
    </a>
    <nav class="steps" aria-label="Steps">
      <button
        v-for="(s, i) in STEPS"
        :key="s.id"
        class="step"
        :class="{ done: stepDone[s.id] && state.step !== s.id }"
        :data-step="s.id"
        :aria-current="state.step === s.id ? 'step' : undefined"
        type="button"
        @click="go(s.id)"
      >
        <b>{{ stepDone[s.id] && state.step !== s.id ? '✓' : i + 1 }}</b><span>{{ s.label }}</span>
      </button>
    </nav>
    <div class="conn" :class="status.kind" role="status" aria-live="polite"><span class="dot" />{{ status.text }}</div>
  </header>
</template>
