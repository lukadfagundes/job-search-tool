import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/preload/index.ts',
      formats: ['es'],
      fileName: () => '[name].js',
    },
    rollupOptions: {
      external: ['electron', /^node:/],
    },
  },
});
