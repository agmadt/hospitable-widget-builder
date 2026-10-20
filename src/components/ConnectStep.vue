<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import Callout from './ui/Callout.vue';
import { TOKEN_HELP, normalizeWorker } from '@/lib/worker';
import { connect, needsProperty, runtime, state, tryDemo } from '@/stores/builder';
import { config } from '@/config';
import { useToast } from '@/composables/useToast';
import { W } from '@/lib/widget';
import type { PropertySummary } from '@/types';

const { toast } = useToast();
const address = ref(runtime.connection?.worker || state.worker);
const invalid = ref(false);
// A connection made elsewhere (the ?worker= return, "Try the demo Worker") fills the box.
watch(() => runtime.connection?.worker, (w) => w && (address.value = w));

async function submit() {
  invalid.value = !normalizeWorker(address.value);
  if (invalid.value) return;
  const result = await connect(address.value);
  if (result?.ok) {
    address.value = result.connection.worker;
    toast('Connected to your Worker');
  }
}

const result = computed(() => runtime.lastConnect);
const conn = computed(() => runtime.connection);
const statusHelp = computed(() => {
  const t = conn.value?.status?.token;
  return t && t !== 'ok' && t !== 'unknown' ? TOKEN_HELP[t] : null;
});

function facts(p: PropertySummary) {
  const beds = p.bedrooms == null ? '' : p.bedrooms === 0 ? 'Studio' : `${p.bedrooms} bedroom${p.bedrooms === 1 ? '' : 's'}`;
  return [p.city, p.max_guests ? `${p.max_guests} guests` : '', beds].filter(Boolean).join(' · ');
}

function price(p: PropertySummary) {
  return typeof p.price_from === 'number' ? String(W().derive({ price_from: p.price_from, currency: p.currency }).price_from_formatted ?? '') : '';
}
</script>

<template>
  <section class="pane">
    <div class="pane-head">
      <h1>Connect your listing</h1>
      <p>Paste your Worker's address. The preview switches to your real listing data.</p>
    </div>

    <form class="connect" @submit.prevent="submit">
      <label for="worker-url">Worker address</label>
      <div class="inline">
        <input id="worker-url" v-model="address" type="text" inputmode="url" placeholder="https://hospitable-widgets.you.workers.dev" autocomplete="off" required>
        <button class="btn primary" type="submit" :disabled="runtime.connecting">{{ runtime.connecting ? 'Connecting…' : 'Connect' }}</button>
      </div>
    </form>
    <p v-if="config.demoWorker && !runtime.connection" class="muted small">No Worker yet? <button class="link" type="button" @click="tryDemo">Use the demo Worker</button> to try this step with sample data.</p>

    <Callout v-if="invalid" kind="warn">That doesn't look like a web address. It should look like <code>https://hospitable-widgets.you.workers.dev</code>.</Callout>

    <template v-else-if="result && !result.ok">
      <Callout v-if="result.reason === 'unreachable'" kind="bad" title="Couldn't reach that address">
        <p>Check that it's your Worker's address from the Cloudflare dashboard. It usually ends in <code>.workers.dev</code>. If you just deployed, give it a minute.</p>
      </Callout>
      <Callout v-else-if="result.reason === 'token'" kind="bad" :title="TOKEN_HELP[result.token].title">
        <p v-html="TOKEN_HELP[result.token].text" />
        <ol v-if="TOKEN_HELP[result.token].fix"><li v-for="s in TOKEN_HELP[result.token].fix" :key="s" v-html="s" /></ol>
      </Callout>
      <Callout v-else kind="bad" title="That address answered, but not like a Hospitable Widgets Worker">
        <p>Got HTTP {{ result.status }}. Check the address.</p>
      </Callout>
    </template>

    <template v-if="conn">
      <Callout v-if="conn.mode === 'dummy'" kind="warn" title="Connected, with sample data">
        <p>Your Worker runs with <code>HOSPITABLE_PAT=dummy</code>. When you're ready, put your real token in its settings and connect again.</p>
      </Callout>
      <Callout v-else kind="good" title="Connected">
        <p>{{ conn.properties.length }} listed propert{{ conn.properties.length === 1 ? 'y' : 'ies' }}. Data refreshes every hour.</p>
      </Callout>
      <Callout v-if="statusHelp" kind="bad" :title="statusHelp.title">
        <p v-html="statusHelp.text" />
        <ol v-if="statusHelp.fix"><li v-for="s in statusHelp.fix" :key="s" v-html="s" /></ol>
        <p>Your widgets keep showing the last good data until this is fixed.</p>
      </Callout>
      <Callout v-else-if="conn.status?.error" kind="warn">
        <p>The last refresh had a problem: {{ conn.status.error }}. Your widgets keep showing the last good data.</p>
      </Callout>
      <Callout v-if="conn.status?.partial" kind="warn">
        <p>You have many properties, so each hourly refresh updates a batch of them in turn. Everything still updates several times a day; the Workers Paid plan lifts this limit.</p>
      </Callout>
      <Callout v-if="!conn.properties.length" kind="warn"><p>Your account has no listed properties yet.</p></Callout>

      <div v-if="conn.properties.length" class="picker" role="radiogroup" aria-label="Property">
        <span class="muted small" style="font-weight: 600">{{ needsProperty ? 'Show this property' : 'Your properties' }}</span>
        <button
          v-for="p in conn.properties"
          :key="p.id"
          type="button"
          class="prop"
          role="radio"
          :data-id="p.id"
          :aria-checked="p.id === state.property"
          @click="state.property = p.id"
        >
          <img v-if="p.photo" :src="p.photo" alt="" loading="lazy"><span v-else class="ph" />
          <div><b>{{ p.property_name }}</b><span>{{ facts(p) }}</span></div>
          <span class="price">{{ price(p) }}</span>
        </button>
      </div>

      <div v-if="conn.properties.length" class="pane-foot">
        <button class="btn primary" type="button" @click="state.step = 'copy'">Next: copy your snippet <span aria-hidden="true">→</span></button>
      </div>
    </template>
  </section>
</template>
