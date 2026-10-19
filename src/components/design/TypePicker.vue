<script setup lang="ts">
import { WIDGET_TYPES } from '@/lib/catalog';
import { STARTERS } from '@/lib/templates';
import { state } from '@/stores/builder';
</script>

<template>
  <div class="group">
    <div class="group-head"><h2>Widget</h2><span class="muted">{{ WIDGET_TYPES.length }} types</span></div>
    <div class="types" role="listbox" aria-label="Widget type">
      <button
        v-for="t in WIDGET_TYPES"
        :key="t.id"
        class="type"
        role="option"
        type="button"
        :data-type="t.id"
        :aria-selected="state.type === t.id"
        @click="state.type = t.id"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" v-html="t.icon" />
        <div><b>{{ t.name }}</b><span>{{ STARTERS[t.id].meta.blurb }}</span></div>
      </button>
    </div>
  </div>
</template>
