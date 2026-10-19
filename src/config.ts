// Settings come from .env (see VITE_* there). Override locally in .env.local.

const repo = import.meta.env.VITE_KIT_REPO || 'agmadt/hospitable-widgets';
const major = import.meta.env.VITE_WIDGET_MAJOR || '1';
const released = `https://cdn.jsdelivr.net/gh/${repo}@${major}/widget/widget.min.js`;
// The builder itself pins the exact release it was built against, so it never
// meets an older copy while jsDelivr still resolves @1 to the previous release.
const pinned = `https://cdn.jsdelivr.net/gh/${repo}@${import.meta.env.VITE_WIDGET_VERSION || major}/widget/widget.min.js`;

export const config = {
  repo,
  repoUrl: `https://github.com/${repo}`,
  deployUrl: `https://deploy.workers.cloudflare.com/?url=https://github.com/${repo}`,
  /** widget.js in the builder's own preview: the kit's local copy during `npm run dev`. */
  previewWidgetSrc: import.meta.env.DEV ? '/hosp/widget.js' : pinned,
  /** widget.js in the snippets hosts paste into their websites. */
  snippetWidgetSrc: released,
  demoWorker: import.meta.env.VITE_DEMO_WORKER || '',
};
