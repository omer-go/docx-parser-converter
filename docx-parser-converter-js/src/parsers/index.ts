/**
 * Parsers module
 * Exports all DOCX parsers for document processing
 */

// Base parser
export { BaseParser } from './base-parser.js';

// Legacy paragraph parser (for backward compatibility)
export { ParagraphParser } from './paragraph-parser.js';

// Document parsers
export * from './document/index.js';

// Style parsers
export * from './styles/index.js';

// Helper parsers
export * from './helpers/index.js';

// Numbering parsers
export * from './numbering/index.js';

// Table parsers (Phase 5)
export * from './tables/index.js';
