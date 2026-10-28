<script setup lang="ts">
import TypePicker from './TypePicker.vue';
import StylePanel from './StylePanel.vue';
import OptionsPanel from './OptionsPanel.vue';
import HtmlEditor from './HtmlEditor.vue';
import { guestWidget, state } from '@/stores/builder';
</script>

<template>
  <section class="pane">
    <div class="pane-head">
      <h1>Design your widget</h1>
      <p>Pick what to show and make it look like your website. You're designing with sample data; your own listing comes in at step 3.</p>
    </div>
    <TypePicker />
    <details class="group" open>
      <summary><h2>Style</h2></summary>
      <StylePanel />
    </details>
    <details class="group" open>
      <summary><h2>Options</h2></summary>
      <OptionsPanel />
    </details>
    <HtmlEditor v-if="!guestWidget" />
    <p v-else class="hint">Widgets for signed-in guests run on your Worker's own page, so their HTML can't be edited here; the options and style above go with them.</p>
    <div class="pane-foot">
      <button class="btn primary" type="button" @click="state.step = 'deploy'">Next: deploy your Worker <span aria-hidden="true">→</span></button>
    </div>
  </section>
</template>
