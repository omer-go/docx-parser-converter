import { defineConfig } from 'vite';
// import { resolve } from 'path'; // Still need this for path manipulation
import path from 'path'; // Standard import for path module
import dts from 'vite-plugin-dts';
import { fileURLToPath } from 'url'; // Import this utility

// Helper to get the directory name, similar to __dirname in CommonJS
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
    }),
  ],
  build: {
    sourcemap: true,
    lib: {
      entry: path.resolve(__dirname, 'src/main.ts'), // Use path.resolve with the derived __dirname
      name: 'DocxParserConverter',
      formats: ['es', 'umd', 'iife'],
      fileName: (format) => `docx-parser-converter.${format}.js`,
    },
    rollupOptions: {
      // ... your rollupOptions
    },
  },
});