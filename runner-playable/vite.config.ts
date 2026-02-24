import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [viteSingleFile()],
  build: {
    assetsInlineLimit: 100000000, // всё в один HTML
    chunkSizeWarningLimit: 5000,
  },
  base: './', // важно для GitHub Pages
});