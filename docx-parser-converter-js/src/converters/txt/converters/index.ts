/**
 * TXT Converters
 * 
 * Specific converters for different DOCX elements to plain text
 */

export { ParagraphConverter } from './paragraph-converter.ts';
export { RunConverter } from './run-converter.ts';
export { TableConverter } from './table-converter.ts';
export { NumberingConverter } from './numbering-converter.ts';

// Import the NumberingSchema type
import type { NumberingSchema } from '@/models/numbering-models.js';

// Common interfaces for TXT conversion
export interface TxtElement {
  /** Plain text content */
  content: string;
  /** Indentation level (number of spaces/tabs) */
  indent?: number;
  /** Whether this element should be followed by a line break */
  lineBreak?: boolean;
  /** Whether this element should have extra spacing before it */
  spaceBefore?: boolean;
  /** Whether this element should have extra spacing after it */
  spaceAfter?: boolean;
}

export interface ConversionContext {
  /** Current indentation level */
  indentLevel: number;
  /** Number of spaces per indent */
  indentSize: number;
  /** Whether to include debug comments */
  includeDebugComments: boolean;
  /** Whether to preserve formatting */
  preserveFormatting: boolean;
  /** Maximum line width for wrapping */
  maxLineWidth: number;
  /** Whether to preserve table structure */
  preserveTableStructure: boolean;
  /** Whether to include heading markers */
  includeHeadingMarkers: boolean;
  /** Warnings encountered during conversion */
  warnings: string[];
  /** Numbering schema for proper list/numbering conversion */
  numberingSchema?: NumberingSchema;
} 