<script setup lang="ts">
import { config } from '@/config';
import { connect, state } from '@/stores/builder';

async function tryDemo() {
  state.step = 'connect';
  await connect(config.demoWorker);
}
</script>

<template>
  <section class="pane">
    <div class="pane-head">
      <h1>Deploy your Worker</h1>
      <p>Your Worker is a tiny program in your own free Cloudflare account. It keeps your Hospitable token private and refreshes your listing data every hour.</p>
    </div>
    <ol class="howto">
      <li>
        <h3>Get a Hospitable token</h3>
        <p>In Hospitable, go to <b>Apps → API access → Access tokens</b> and add a new token with <b>Read</b> permission. Copy it.</p>
        <p class="hint">Just trying things out? Type <code>dummy</code> instead of a token and everything runs on sample data.</p>
      </li>
      <li>
        <h3>Click Deploy to Cloudflare</h3>
        <p>Sign in to Cloudflare and GitHub (both accept Google sign-in), paste your token into <b>HOSPITABLE_PAT</b>, and deploy. It takes about a minute.</p>
        <a class="deploy" :href="config.deployUrl" target="_blank" rel="noopener">
          <img src="https://deploy.workers.cloudflare.com/button" alt="Deploy to Cloudflare" width="200" height="36">
        </a>
        <p class="hint">Your design is saved in this browser, so it's still here when you come back.</p>
      </li>
      <li>
        <h3>Come back here</h3>
        <p>When it's done, click your Worker's link (<code>https://…workers.dev</code>) in the Cloudflare dashboard. It sends you straight back to this page, already connected.</p>
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
