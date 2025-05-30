/**
 * HTML Converters
 * 
 * Specific converters for different DOCX elements to HTML
 */

export { StyleConverter } from './style-converter';
export { ParagraphConverter } from './paragraph-converter';
export { RunConverter } from './run-converter';
export { TableConverter } from './table-converter';
export { NumberingConverter } from './numbering-converter';

// Import the NumberingSchema type
import type { NumberingSchema } from '@/models/numbering-models.js';

// Common interfaces for HTML conversion
export interface HtmlElement {
  /** HTML tag name */
  tag: string;
  /** HTML attributes */
  attributes?: Record<string, string> | undefined;
  /** HTML content (text or child elements) */
  content?: string | HtmlElement[] | undefined;
  /** Whether this element is self-closing */
  selfClosing?: boolean | undefined;
}

export interface CssRule {
  /** CSS selector */
  selector: string;
  /** CSS properties */
  properties: Record<string, string>;
}

export interface ConversionContext {
  /** Current class name prefix */
  classPrefix: string;
  /** Whether to include debug comments */
  includeDebugComments: boolean;
  /** CSS rules accumulated during conversion */
  cssRules: CssRule[];
  /** Warnings encountered during conversion */
  warnings: string[];
  /** Numbering schema for proper list/numbering conversion */
  numberingSchema?: NumberingSchema;
} 