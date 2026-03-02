import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    conditions: ['node'],
    mainFields: ['module', 'jsnext:main', 'jsnext'],
  },
  build: {
    lib: {
      entry: 'src/main/index.ts',
      formats: ['es'],
      fileName: () => '[name].js',
    },
    rollupOptions: {
      external: ['electron', /^node:/],
    },
  },
});
