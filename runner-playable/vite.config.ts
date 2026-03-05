import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [viteSingleFile()],
  base: './',
  build: {
    assetsInlineLimit: 100000000,
    chunkSizeWarningLimit: 5000,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        // inlineDynamicImports deprecated — используем codeSplitting: false
        manualChunks: undefined,
      }
    }
  },
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.mp3'],
  // JSON как URL через ?url — не нужно в assetsInclude
});