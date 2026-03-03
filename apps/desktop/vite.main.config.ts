import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
  build: {
    rollupOptions: {
      // Externalize pdf-parse and mammoth so they are require()'d at runtime
      // rather than bundled. pdf-parse v1 has debug code that reads test files
      // relative to its own directory, which breaks when bundled by Vite.
      external: [
        'pdf-parse',
        'pdf-parse/lib/pdf-parse.js',
        'mammoth',
        'pdfmake',
        'pdfmake/js/Printer.js',
        'electron-updater',
        'electron-squirrel-startup',
      ],
    },
  },
});
