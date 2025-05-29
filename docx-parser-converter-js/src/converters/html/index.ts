/**
 * HTML Conversion System
 * 
 * Main entry point for converting DOCX document structures to HTML
 * with proper CSS styling and semantic markup.
 */

export { DocxToHtmlConverter } from './docx-to-html-converter';
export { HtmlGenerator } from './html-generator';
export { DocxProcessor } from './docx-processor';

// Export all specific converters
export * from './converters/index';

// Common types for HTML conversion
export interface HtmlConversionOptions {
  /** Whether to include CSS styles inline or in a separate stylesheet */
  inlineStyles?: boolean;
  /** Custom CSS class prefix for generated styles */
  classPrefix?: string;
  /** Whether to preserve DOCX structure as closely as possible */
  preserveStructure?: boolean;
  /** Whether to include debug comments in HTML output */
  includeDebugComments?: boolean;
}

export interface HtmlConversionResult {
  /** The generated HTML content */
  html: string;
  /** The generated CSS stylesheet */
  css: string;
  /** Any warnings encountered during conversion */
  warnings: string[];
  /** Metadata about the conversion */
  metadata: {
    paragraphCount: number;
    tableCount: number;
    totalElements: number;
    processingTime: number;
  };
} 