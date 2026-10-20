<script setup lang="ts">
import { config } from '@/config';
import { state, tryDemo } from '@/stores/builder';
</script>

<template>
  <section class="pane">
    <div class="pane-head">
      <h1>Deploy your Worker</h1>
      <p>Your Worker is a tiny program in your own free Cloudflare account. It keeps your Hospitable token private and refreshes your listing data every hour.</p>
      <p v-if="config.demoWorker" class="hint">Just looking around? <button class="link" type="button" @click="tryDemo">Use the demo Worker</button> to try the next steps with sample data, without deploying anything.</p>
    </div>
    <ol class="howto">
      <li>
        <h3>Get a Hospitable token</h3>
        <p>In Hospitable, go to <b>Apps → API access → Access tokens</b> and add a new token with <b>Read</b> permission. Copy it.</p>
        <p class="hint">Just trying things out? On Cloudflare's page, type <code>dummy</code> instead of a token and everything runs on sample data.</p>
      </li>
      <li>
        <h3>Click Deploy to Cloudflare</h3>
        <p>The button opens Cloudflare's own website (<code>dash.cloudflare.com</code>) in a new tab. Sign in to Cloudflare and GitHub there (both accept Google sign-in), paste your token into the field named <b>HOSPITABLE_PAT</b> on that page, and deploy. It takes about a minute.</p>
        <p class="hint">That Cloudflare page is the only place your token goes. This builder never asks for it and never sees it.</p>
        <a class="deploy" :href="config.deployUrl" target="_blank" rel="noopener">
          <img src="https://deploy.workers.cloudflare.com/button" alt="Deploy to Cloudflare" width="200" height="36">
        </a>
        <p class="hint">Your design is saved in this browser, so it's still here when you come back.</p>
      </li>
      <li>
        <h3>Open your Worker</h3>
        <p>When Cloudflare finishes, click your Worker's address (<code>https://…workers.dev</code>) on its success page or in the dashboard. It opens the builder in a new tab, already connected, and this tab connects too.</p>
      </li>
    </ol>
    <div class="callout">
      <b>Already deployed?</b>
      <button class="link" type="button" @click="state.step = 'connect'">Paste your Worker's address</button>
      <template v-if="config.demoWorker">
        <span class="sep">·</span>
        <button class="link" type="button" @click="tryDemo">Try the demo Worker</button>
      </template>
    </div>
  </section>
</template>
