import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      include: ['src/**/*'],
      exclude: ['test/**/*', 'node_modules/**/*'],
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'DocxParserConverter',
      formats: ['es', 'umd'],
      fileName: (format) => `index.${format}.js`,
    },
    rollupOptions: {
      external: ['fast-xml-parser', 'zod'],
      output: {
        globals: {
          'fast-xml-parser': 'FastXMLParser',
          'zod': 'z',
        },
      },
    },
    target: 'es2022',
    minify: 'esbuild',
    sourcemap: true,
  },
  worker: {
    format: 'es',
    plugins: () => [
      dts({
        insertTypesEntry: false,
        include: ['src/workers/**/*'],
      }),
    ],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
  },
  optimizeDeps: {
    exclude: ['src/workers/parser-worker.ts', 'src/workers/converter-worker.ts'],
  },
}); 