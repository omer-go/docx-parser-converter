import { defineConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';

export default defineConfig({
  plugins: [
    legacy({
      targets: ['defaults', 'not IE 11']
    })
  ],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'DocxParserConverter',
      fileName: (format) => `docx-parser-converter.${format}.js`
    },
    rollupOptions: {
      // Ensure external dependencies are not bundled
      external: [], 
      output: {
        // Provide global variables to use in the UMD build
        globals: {} 
      }
    },
    sourcemap: true
  }
});
