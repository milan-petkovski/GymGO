import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    minify: 'oxc',
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        privacy: resolve(import.meta.dirname, 'privacy.html'),
        support: resolve(import.meta.dirname, 'support.html'),
        terms: resolve(import.meta.dirname, 'terms.html'),
      },
    },
  },
  server: {
    open: true,
  },
});
