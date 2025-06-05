// vite.config.ts
import { defineConfig } from 'vite';
import path from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      outDir: 'dist/types',
    }),
  ],
  build: {
    sourcemap: true,
    lib: {
      entry: 'src/main.ts', // Or path.resolve(process.cwd(), 'src/main.ts')
      name: 'DocxParserConverter', // Or 'MyLib'
      formats: ['es', 'umd', 'iife'],
      fileName: (format) => `docx-parser-converter.${format}.js`,
    },
    rollupOptions: {
            output: {
        exports: 'named',
      }
    },
  },
});