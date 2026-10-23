import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        game: resolve(__dirname, 'game.html'),
        three: resolve(__dirname, 'three.html'),
        forms: resolve(__dirname, 'forms.html'),
      },
    },
  },
  server: {
    open: true,
  },
});
