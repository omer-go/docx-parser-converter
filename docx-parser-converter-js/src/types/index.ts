/**
 * Type definitions for DOCX Parser Converter
 * Central location for all TypeScript types used throughout the library
 */

// Re-export all model types
export type {
  BaseModel,
  ModelValidationError,
} from '@/models/base-model.js';

export type {
  DocumentSchema,
  DocMargins,
} from '@/models/document-models.js';

export type {
  Paragraph,
  ParagraphNumbering,
  Run,
  RunContent,
  TextContent,
  TabContent,
} from '@/models/paragraph-models.js';

export type {
  FontProperties,
  ParagraphStyleProperties,
  RunStyleProperties,
  SpacingProperties,
  IndentationProperties,
  LanguageProperties,
  TabStop,
  Style,
  StyleDefaults,
  StylesSchema,
} from '@/models/styles-models.js';

export type {
  Table,
  TableRow,
  TableCell,
  TableGrid,
  TableProperties,
  TableRowProperties,
  TableCellProperties,
  TableCellBorders,
  BorderProperties,
  ShadingProperties,
  MarginProperties,
  TableWidth,
  TableIndent,
  TableLook,
} from '@/models/table-models.js';

export type {
  NumberingLevel,
  NumberingInstance,
  NumberingSchema,
} from '@/models/numbering-models.js';

// Parser result types
export interface ParserResult<T> {
  data: T;
  warnings: string[];
  processingTime?: number;
}

export interface ParserContext {
  namespaces: Record<string, string>;
  depth: number;
  options: Record<string, unknown>;
  warnings: string[];
}

// Conversion option types
export interface BaseConversionOptions {
  preserveFormatting?: boolean;
  includeDebugComments?: boolean;
}

// File handling types
export interface FileInfo {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

export interface ProcessingMetadata {
  paragraphCount: number;
  tableCount: number;
  totalElements: number;
  processingTime: number;
}

// Error types
export interface ConversionError {
  code: string;
  message: string;
  context?: Record<string, unknown>;
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>; 