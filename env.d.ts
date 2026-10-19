/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** The public kit on GitHub, "owner/repo". */
  readonly VITE_KIT_REPO?: string;
  /** Major version of widget.js that snippets load from jsDelivr. */
  readonly VITE_WIDGET_MAJOR?: string;
  /** Exact widget.js release the builder's own preview loads. */
  readonly VITE_WIDGET_VERSION?: string;
  /** A Worker running with HOSPITABLE_PAT=dummy, for "Try the demo Worker". */
  readonly VITE_DEMO_WORKER?: string;
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<object, object, unknown>;
  export default component;
}
