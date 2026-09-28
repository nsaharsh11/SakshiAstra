import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  build: { rollupOptions: { input: {
    index: fileURLToPath(new URL('./index.html', import.meta.url)),
    SakshiAstra: fileURLToPath(new URL('./SakshiAstra.html', import.meta.url)),
  } } },
});
