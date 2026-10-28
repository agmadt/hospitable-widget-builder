<script setup lang="ts">
import { WIDGET_TYPES } from '@/lib/catalog';
import { STARTERS } from '@/lib/templates';
import { state } from '@/stores/builder';

const GROUPS = [
  { title: 'Widget', note: 'for every visitor', types: WIDGET_TYPES.filter((t) => !t.guest) },
  { title: 'For signed-in guests', note: 'their own stay, after they sign in with their booking', types: WIDGET_TYPES.filter((t) => t.guest) },
];
</script>

<template>
  <div v-for="g in GROUPS" :key="g.title" class="group">
    <div class="group-head"><h2>{{ g.title }}</h2><span class="muted">{{ g.types.length }} types</span></div>
    <p v-if="g.types[0]?.guest" class="hint" style="margin: -6px 0 10px">Guests sign in with their booking code and last name. These widgets go on your website as an iframe from your Worker, which keeps the sign-in.</p>
    <div class="types" role="listbox" :aria-label="g.title">
      <button
        v-for="t in g.types"
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
