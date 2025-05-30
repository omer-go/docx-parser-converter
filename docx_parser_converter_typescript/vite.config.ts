import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'), // Adjust if your entry point is different
      name: 'DocxParserConverter',
      fileName: (format) => `docx-parser-converter.${format}.js`,
      formats: ['es', 'umd']
    },
    rollupOptions: {
      // Make sure to externalize deps that shouldn't be bundled
      // into your library
      external: [], // Add external dependencies here if any
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {}, // Add globals here if any
      },
    },
    sourcemap: true, // Enable source maps
    // Ensure tree-shaking is effective
    minify: 'terser', // Use terser for minification which supports tree-shaking
  },
  // optimizeDeps: {
  //   include: ['fast-xml-parser', 'zod'] // Example if needed
  // }
});
