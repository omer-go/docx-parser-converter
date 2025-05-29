/**
 * TXT Conversion System
 * 
 * Main entry point for converting DOCX document structures to plain text
 * with proper formatting and readable structure preservation.
 */

export { DocxToTxtConverter } from './docx-to-txt-converter.ts';
export { TxtGenerator } from './txt-generator.ts';
export { DocxProcessor } from './docx-processor.ts';

// Export all specific converters
export * from './converters/index.ts';

// Common types for TXT conversion
export interface TxtConversionOptions {
  /** Whether to preserve line breaks and spacing */
  preserveFormatting?: boolean;
  /** Number of spaces to use for indentation */
  indentSize?: number;
  /** Whether to include heading numbers/markers */
  includeHeadingMarkers?: boolean;
  /** Whether to preserve table structure with ASCII art */
  preserveTableStructure?: boolean;
  /** Maximum line width for text wrapping (0 = no wrapping) */
  maxLineWidth?: number;
  /** Whether to include debug information in output */
  includeDebugComments?: boolean;
}

export interface TxtConversionResult {
  /** The generated plain text content */
  text: string;
  /** Any warnings encountered during conversion */
  warnings: string[];
  /** Metadata about the conversion */
  metadata: {
    paragraphCount: number;
    tableCount: number;
    totalElements: number;
    lineCount: number;
    characterCount: number;
    processingTime: number;
  };
} 