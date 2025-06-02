// src/main.ts

// Import and re-export the core conversion function or class
// For example, if you have a primary function to trigger conversion:
// export { convertDocxToHtmlAndText } from './core/docxConverter';

// Or export specific parsers or models if you want them to be part of the public API
// export * from './core/models/paragraph_models';
// export * from './core/parsers/DocumentNumberingParser';

// For now, let's just have a placeholder
export function helloLibrary(): string {
  console.log("Hello from DocxConverter library!");
  return "DocxConverter Initialized";
}

// You'll eventually export your main conversion function(s) here.
// Example (hypothetical):
/*
import { processDocxFile } from './core/processor';
export { processDocxFile };
*/

console.log("DocxConverter Library (main.ts) loaded for development/testing.");