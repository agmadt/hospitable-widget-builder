<script setup lang="ts">
import { computed, ref } from 'vue';
import Callout from './ui/Callout.vue';
import { useSnippet } from '@/composables/useSnippet';
import { highlight } from '@/lib/html';
import { copyText } from '@/lib/clipboard';
import { iframeCode, testPage } from '@/lib/snippet';
import { EMBED_PLATFORMS, PLATFORMS } from '@/lib/catalog';
import { cacheDuration, cachePeriod } from '@/lib/worker';
import { config } from '@/config';
import { body, codeKind, design, guestWidget, onDemo, runtime, snippetStyle, state, tryDemo } from '@/stores/builder';
import { useWeight } from '@/composables/useWeight';
import { useToast } from '@/composables/useToast';

const { snippet, build, embed } = useSnippet();
const { toast } = useToast();
const weight = useWeight();
const kb = (bytes: number) => `${(bytes / 1024).toFixed(1)} KB`;
const copied = ref(false);

const iframe = computed(() => codeKind.value === 'iframe');
/** What the big copy button copies: the snippet, or the iframe code. */
const code = computed(() => (iframe.value ? embed.value?.code : snippet.value) ?? null);
const size = computed(() => (snippet.value ? (new Blob([snippet.value]).size / 1024).toFixed(1) : '0'));
const platforms = computed(() => (iframe.value ? EMBED_PLATFORMS : PLATFORMS));
const platform = computed(() => platforms.value.find((p) => p.id === state.platform) ?? platforms.value[0]);
// Read more and accordions grow when opened; a fixed-height embed can't.
const grows = computed(() => /data-grows|<details|d-more/.test(body.value));
const guest = computed(() => runtime.connection?.guest ?? null);
/** The embed page is one more request to the Worker per view. */
const requests = computed(() => (weight.value ? weight.value.requests + (iframe.value ? 1 : 0) : 0));
const secret = ref('');

async function copy(text = code.value) {
  if (!text) return;
  await copyText(text);
  copied.value = true;
  setTimeout(() => (copied.value = false), 1600);
}

async function copyLink() {
  if (!embed.value) return;
  await copyText(embed.value.link);
  toast('Link copied');
}

/** 32 random bytes as hex: GUEST_SECRET signs guests' sign-ins on the Worker. */
async function makeSecret() {
  secret.value = Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => b.toString(16).padStart(2, '0')).join('');
  await copyText(secret.value);
  toast('Secret copied: paste it into Cloudflare now');
}

function blobUrl(html: string) {
  return URL.createObjectURL(new Blob([html], { type: 'text/html' }));
}

/** The page a website would show: the snippet, or the iframe, with the sign-in next to a guest widget. */
function testHtml(widgetSrc?: string): string | null {
  const conn = runtime.connection;
  if (!conn) return null;
  if (!iframe.value) {
    const s = widgetSrc ? build(widgetSrc) : snippet.value;
    return s && testPage(s, conn.worker, state.dark);
  }
  if (!embed.value) return null;
  let html = embed.value.code;
  if (guestWidget.value && state.type !== 'guest-login') {
    const login = `${conn.worker}/embed/guest-login?data=stay&modules=guest${snippetStyle.value ? `&style=${encodeURIComponent(snippetStyle.value)}` : ''}`;
    html = iframeCode(login, 'Guest sign-in', 420) + '\n' + html;
  }
  return testPage(html, conn.worker, state.dark);
}

function openTest() {
  // Blob pages can't resolve "/widget.js", so give the preview's copy as a full URL.
  const html = testHtml(new URL(config.previewWidgetSrc, location.href).href);
  if (html) window.open(blobUrl(html), '_blank', 'noopener');
}

function download() {
  const html = testHtml();
  if (!html) return;
  const a = document.createElement('a');
  a.href = blobUrl(html);
  a.download = `${state.type}-widget.html`;
  a.click();
}
</script>

<template>
  <section class="pane">
    <div class="pane-head">
      <h1>{{ iframe ? 'Copy your embed' : 'Copy your snippet' }}</h1>
      <p v-if="guestWidget">This widget goes on your website as an iframe from your Worker. Guests sign in once, in the Guest sign-in widget, and every guest widget on your website shows their stay.</p>
      <p v-else>Paste it into an <b>Embed HTML</b> element on your website. That's the last step: your widget updates itself from now on.</p>
    </div>

    <Callout v-if="!runtime.connection" kind="warn" title="Connect your Worker first">
      <p>
        The {{ iframe ? 'embed' : 'snippet' }} loads data from your own Worker, so it needs its address.
        <button class="link" type="button" @click="state.step = 'deploy'">Deploy one</button> or
        <button class="link" type="button" @click="state.step = 'connect'">connect it</button><template v-if="config.demoWorker">, or <button class="link" type="button" @click="tryDemo">use the demo Worker</button> to see how it works</template>.
      </p>
    </Callout>

    <template v-else>
      <template v-if="guestWidget">
        <Callout v-if="!guest" kind="warn" title="Update your Worker first">
          <p>Guest sign-in needs version 1.3 of the kit or newer. In your copy of hospitable-widgets on GitHub, open <b>Actions</b>, run <b>Update from hospitable-widgets</b>, then connect again.</p>
        </Callout>
        <Callout v-else-if="!guest.on" kind="warn" title="Turn on guest sign-in">
          <p>In Cloudflare, open your Worker → <b>Settings → Variables and Secrets</b> and add:</p>
          <ol>
            <li v-if="guest.missing.includes('GUEST_SECRET')">
              A <b>Secret</b> named <code>GUEST_SECRET</code>, at least 32 characters. It signs guests' sign-ins; a new one signs everyone out.
              <button class="link" type="button" @click="makeSecret">Make one and copy it</button>
              <code v-if="secret" class="secret">{{ secret }}</code>
            </li>
            <li v-if="guest.missing.includes('GUEST_SITES')">A <b>Text</b> variable named <code>GUEST_SITES</code> with your website's addresses, such as <code>villakayu.com, www.villakayu.com</code>. Only those websites can show guest widgets.</li>
            <li>Deploy, then <button class="link" type="button" @click="state.step = 'connect'">connect again</button>.</li>
          </ol>
        </Callout>
        <Callout v-else-if="runtime.connection.mode === 'dummy'" kind="good" title="Guest sign-in works, with sample stays">
          <p>Sign in with <code>HM4CXJ4KPX</code> and <code>Moore</code> (arriving today), or <code>4182736455</code> and <code>Becker</code> (in 12 days). Any website can show them while your Worker runs on sample data.</p>
        </Callout>
        <Callout v-else kind="good" title="Guest sign-in is on">
          <p>
            Websites that can show guest widgets: <b>{{ guest.sites.join(', ') }}</b>. Door codes, Wi-Fi and check-in instructions appear {{ guest.reveal_hours }} hours before check-in
            and stop at check-out.
          </p>
        </Callout>
      </template>
      <div v-else class="kind">
        <div class="seg" role="radiogroup" aria-label="Code type">
          <button type="button" data-kind="snippet" :aria-pressed="state.codeKind === 'snippet'" @click="state.codeKind = 'snippet'">Snippet</button>
          <button type="button" data-kind="iframe" :aria-pressed="state.codeKind === 'iframe'" @click="state.codeKind = 'iframe'">Iframe</button>
        </div>
        <span class="muted small">{{ iframe ? 'For sites that only take a link or an iframe, such as Hospitable Pages.' : 'Recommended: it fits its height and can use your site’s font.' }}</span>
      </div>

      <Callout v-if="iframe && design.custom !== null" kind="warn" title="The iframe uses the starter design">
        <p>Your options and style go with it, but the HTML you edited only works in the snippet.</p>
      </Callout>

      <div>
        <div class="snippet-bar">
          <button class="btn primary" :class="{ ok: copied }" type="button" @click="copy()">{{ copied ? 'Copied ✓' : iframe ? 'Copy iframe code' : 'Copy snippet' }}</button>
          <button v-if="iframe" class="btn ghost" type="button" @click="copyLink">Copy link</button>
          <button class="btn ghost" type="button" title="Opens the widget on its own page, as a website would show it" @click="openTest">Open test page</button>
          <button v-if="!iframe" class="btn ghost" type="button" @click="download">Download .html</button>
        </div>
        <!-- A link, not window.open: the tab opens even where popups are blocked, and the copy starts while this page still has focus. -->
        <p v-if="!iframe" class="muted small tester">
          Want a closer look? <a class="link" :href="config.embedTester" target="_blank" rel="noopener" @click="copy()">Check it in the Embed Code Tester</a>.
          The link copies your snippet: paste it there and click Run Code to see everything it loads and whether anything fails.
        </p>
        <div v-if="runtime.heights" class="height-tip">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18M8 7l4-4 4 4M8 17l4 4 4-4" /></svg>
          <span>
            <template v-if="iframe">Hospitable Pages fits the frame by itself. Elsewhere, set it to about <b>{{ runtime.heights.desktop }} px</b> on desktop and <b>{{ runtime.heights.mobile }} px</b> on mobile.</template>
            <template v-else>Set the embed's height to about <b>{{ runtime.heights.desktop }} px</b> on desktop and <b>{{ runtime.heights.mobile }} px</b> on mobile.</template>
            <template v-if="grows"> Sections that open (Read more, accordions) need extra room, because fixed-height embeds do not grow.</template>
          </span>
        </div>
        <div v-if="weight" class="weight" aria-label="What this widget costs a website">
          <div>
            <b>{{ weight.total !== null ? kb(weight.total) : '…' }}</b>
            <span>JavaScript, cached by jsDelivr</span>
            <small>{{ weight.files.map((f) => (f.size ? `${f.name} ${kb(f.size)}` : f.name)).join(' + ') }}</small>
          </div>
          <div>
            <b>{{ requests }}</b>
            <span>request{{ requests === 1 ? '' : 's' }} to your Worker per {{ iframe ? 'view' : `visitor ${cachePeriod(runtime.connection.cacheMinutes)}` }}</span>
            <small>{{ guestWidget ? 'the page, and the guest’s stay' : iframe ? 'the page, and the data' : 'shared with your other widgets for this property' }}</small>
          </div>
        </div>
        <template v-if="iframe && embed">
          <label class="label small" for="embed-link">Link</label>
          <input id="embed-link" class="embed-link" type="text" readonly :value="embed.link" @focus="($event.target as HTMLInputElement).select()">
        </template>
        <pre id="snippet" class="snippet" tabindex="0" :aria-label="iframe ? 'Your iframe code' : 'Your snippet'" v-html="highlight(code ?? '')" />
        <p class="muted small">
          <template v-if="iframe">A page of its own on your Worker: the design loads from jsDelivr, the data from your Worker{{ guestWidget ? ', and only after the guest signs in' : '' }}.</template>
          <template v-else-if="design.custom === null">One element and one script: the design loads from jsDelivr, the data from your Worker.</template>
          <template v-else>{{ size }} KB: your own HTML travels in the snippet.</template>
          <template v-if="!iframe"> Visitors' browsers keep the last data, so returning visitors still see the widget if your Worker can't be reached.</template>
          <template v-if="onDemo"> You're connected to the demo Worker, so this shows sample data. Deploy your own Worker to show your listings.</template>
          <template v-else-if="runtime.connection.mode === 'dummy'"> This shows sample data until your Worker has a real token.</template>
        </p>
      </div>
    </template>

    <div class="guides">
      <h2>Add it to your website</h2>
      <div class="guide-tabs" role="tablist">
        <button v-for="p in platforms" :key="p.id" role="tab" type="button" :aria-selected="p.id === platform.id" @click="state.platform = p.id">{{ p.label }}</button>
      </div>
      <ol class="guide-body"><li v-for="s in platform.steps" :key="s" v-html="s" /></ol>
      <Callout v-if="!iframe && state.platform === 'wix' && state.style.font === 'site'" kind="warn" title="Wix can't share your site's font">
        <p>
          A Wix embed is a separate little page, so a widget set to “Same as my website” shows the browser's default font there.
          Go back to <button class="link" type="button" @click="state.step = 'design'">Design</button> and pick your site's font under Style.
        </p>
      </Callout>
      <Callout v-if="iframe && state.style.font === 'site'" kind="warn" title="An iframe can't share your site's font">
        <p>Pick your site's font under Style in <button class="link" type="button" @click="state.step = 'design'">Design</button>.</p>
      </Callout>
    </div>
    <p class="hint">Changed your design later? Come back, adjust it, and copy it again. Changes to your listing in Hospitable reach your website on their own: your Worker picks them up within an hour<template v-if="!iframe && runtime.connection?.cacheMinutes">, and visitors who already saw the widget get them within {{ cacheDuration(runtime.connection.cacheMinutes) }} after that</template>.</p>
  </section>
</template>

<style scoped>
.tester { margin: 10px 0 0; }
.kind { display: grid; gap: 6px; justify-items: start; }
.weight { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px; }
.weight > div { padding: 10px 12px; border-radius: 10px; background: var(--line-2); display: grid; gap: 1px; }
.weight b { font-size: 18px; letter-spacing: -.01em; }
.weight span { font-size: 12.5px; color: var(--ink-2); }
.weight small { font-size: 11.5px; color: var(--muted); }
.label { display: block; margin-top: 14px; font-weight: 600; }
.embed-link { width: 100%; margin-top: 4px; font: 12px/1.4 var(--mono); }
.secret { display: block; margin-top: 6px; word-break: break-all; user-select: all; }
</style>
