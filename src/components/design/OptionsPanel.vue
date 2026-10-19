<script setup lang="ts">
import OptionField from './OptionField.vue';
import { design, optionValues, setOption, starter } from '@/stores/builder';
</script>

<template>
  <p v-if="design.custom !== null" class="disabled-note">
    You are editing this widget's HTML directly, so these options are off. Use “Reset to the starter template” under Advanced to bring them back.
  </p>
  <div v-else class="fields">
    <OptionField
      v-for="o in starter.meta.options"
      :key="`${starter.meta.name}-${o.key}`"
      :option="o"
      :model-value="optionValues[o.key] ?? ''"
      @update:model-value="setOption(o.key, $event)"
    />
    <p v-if="!starter.meta.options.length" class="hint">This widget has no extra options.</p>
  </div>
</template>
