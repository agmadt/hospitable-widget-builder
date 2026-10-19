import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { readFileSync, existsSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// In development the preview runs the kit's local widget.js and modules
// (../hospitable-widgets/widget, or KIT_DIR), served at /hosp/, so a change to
// them shows up on reload. Production builds load the released files from jsDelivr.
function localWidget(): Plugin {
  const dir = resolve(process.env.KIT_DIR || '../hospitable-widgets', 'widget');
  const types: Record<string, string> = { '.js': 'text/javascript', '.json': 'application/json' };
  return {
    name: 'local-widget-js',
    apply: 'serve',
    configureServer(server) {
      server.watcher.add(dir);
      server.middlewares.use('/hosp', (req, res) => {
        const file = resolve(dir, '.' + decodeURIComponent((req.url || '/').split('?')[0]));
        if (!file.startsWith(dir) || !existsSync(file)) {
          res.statusCode = 404;
          res.end(`Not found in ${dir}. Set KIT_DIR to your hospitable-widgets checkout.`);
          return;
        }
        res.setHeader('Content-Type', `${types[extname(file)] || 'application/octet-stream'}; charset=utf-8`);
        res.setHeader('Cache-Control', 'no-store');
        res.end(readFileSync(file));
      });
    },
  };
}

export default defineConfig({
  plugins: [vue(), localWidget()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: { host: '127.0.0.1', port: 5173 },
  test: {
    environment: 'happy-dom',
    include: ['test/**/*.test.ts'],
  },
});
