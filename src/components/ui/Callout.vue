<script setup lang="ts">
defineProps<{ kind?: 'good' | 'warn' | 'bad'; title?: string }>();
</script>

<template>
  <div class="callout" :class="kind">
    <h3 v-if="title">{{ title }}</h3>
    <slot />
  </div>
</template>
