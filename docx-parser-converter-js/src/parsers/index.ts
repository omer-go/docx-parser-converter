/**
 * Parsers module
 * Exports all DOCX parsers for document processing
 */

// Base parser
export { BaseParser } from './base-parser';

// Legacy paragraph parser (for backward compatibility) - REMOVING as ./paragraph-parser.js does not exist
// export { ParagraphParser } from './paragraph-parser.js';

// Document parsers
export * from './document/index';

// Style parsers
export * from './styles/index';

// Helper parsers
export * from './helpers/index';

// Numbering parsers
export * from './numbering/index';

// Table parsers (Phase 5)
export * from './tables/index';
