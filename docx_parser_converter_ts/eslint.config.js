// eslint.config.js
import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  // Base JavaScript and Global Settings
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx,mts,cts}"], // Apply to all relevant JS/TS files
    languageOptions: {
      globals: {
        ...globals.browser, // For browser APIs like window, document
        ...globals.node,    // For Node.js APIs like process, require (if your library uses them or for tests)
        // Add other globals if needed, e.g., globals.jest for Jest tests
      },
    },
  },

  // ESLint recommended rules for JavaScript
  pluginJs.configs.recommended,

  // TypeScript specific configurations
  // This will apply to .ts, .tsx, .mts, .cts files by default
  ...tseslint.configs.recommended, // This includes parser, plugin, and recommended rules for TS

  // Optional: If you need to override or add specific TS rules or parser options
  // {
  //   files: ["**/*.{ts,tsx,mts,cts}"],
  //   languageOptions: {
  //     parserOptions: {
  //       project: true, // Automatically finds tsconfig.json, or specify path: "./tsconfig.json"
  //       tsconfigRootDir: import.meta.dirname, // Or process.cwd()
  //     },
  //   },
  //   rules: {
  //     // Your custom TypeScript rules here
  //     // e.g., "@typescript-eslint/no-explicit-any": "warn",
  //   },
  // },

  // Files to ignore
  {
    ignores: [
      "node_modules/",
      "dist/",
      "**/*.config.js", // Ignores this eslint.config.js
      "**/*.config.ts", // Ignores vite.config.ts
      // Add any other specific files or directories your project generates or uses for tooling
      // "coverage/",
      // ".vite/",
    ],
  },
];