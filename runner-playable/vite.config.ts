import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [viteSingleFile()],
  base: './',
  build: {
    assetsInlineLimit: 100000000,
    chunkSizeWarningLimit: 5000,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
  json: {
    stringify: false,
  },
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.json'],
});