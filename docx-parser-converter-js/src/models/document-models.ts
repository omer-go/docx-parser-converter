// src/models/document-models.ts
import { z } from 'zod';
import { NonNegativeIntSchema, NotEmptyStringSchema } from '../types/common';
import { StyleDefinitionSchema } from './styles-models';
import { ParagraphSchema } from './paragraph-models'; // Assuming ParagraphSchema is defined
import { TableModelSchema } from './table-models';
import { AbstractNumberingDefinitionSchema, NumberingInstanceSchema } from './numbering-models';

export const PageMarginsSchema = z.object({
  top: NonNegativeIntSchema.optional(),    // Margin in Twips
  bottom: NonNegativeIntSchema.optional(),
  left: NonNegativeIntSchema.optional(),
  right: NonNegativeIntSchema.optional(),
  header: NonNegativeIntSchema.optional(), // Distance from edge to header
  footer: NonNegativeIntSchema.optional(), // Distance from edge to footer
  gutter: NonNegativeIntSchema.optional(), // Gutter margin
}).strict();
export type PageMargins = z.infer<typeof PageMarginsSchema>;

export const PageOrientationEnum = z.enum(['portrait', 'landscape']);
export type PageOrientation = z.infer<typeof PageOrientationEnum>;

export const PageSizeSchema = z.object({
  width: NonNegativeIntSchema,  // Page width in Twips
  height: NonNegativeIntSchema, // Page height in Twips
  orientation: PageOrientationEnum.optional().default('portrait'),
}).strict();
export type PageSize = z.infer<typeof PageSizeSchema>;

// Union of elements that can be direct children of the document body or a section.
// This will be expanded to include TableSchema.
export const DocumentBodyElementSchema = z.union([
    ParagraphSchema,
    TableModelSchema, 
    // SectionBreakSchema (if sections are handled as elements)
]);
export type DocumentBodyElement = z.infer<typeof DocumentBodyElementSchema>;

// For now, HeaderFooterContent is simple. It will expand.
// It would typically contain Paragraphs and Tables.
export const HeaderFooterContentSchema = z.object({
    children: z.array(DocumentBodyElementSchema) 
}).strict();
export type HeaderFooterContent = z.infer<typeof HeaderFooterContentSchema>;

export const SectionPropertiesSchema = z.object({
  pageSize: PageSizeSchema.optional(),
  pageMargins: PageMarginsSchema.optional(),
  // Placeholder for columns, headers, footers, etc.
  // headerRefs: z.array(z.object({ type: z.enum(['default', 'first', 'even']), id: NotEmptyStringSchema })).optional(),
  // footerRefs: z.array(z.object({ type: z.enum(['default', 'first', 'even']), id: NotEmptyStringSchema })).optional(),
  // columnProperties: z.any().optional(), // Define later
}).strict();
export type SectionProperties = z.infer<typeof SectionPropertiesSchema>;

export const DocumentSettingsSchema = z.object({
  defaultLanguage: NotEmptyStringSchema.optional().default('en-US'),
  updateFieldsOnOpen: z.boolean().optional().default(false),
  // Add other document-level settings like evenAndOddHeaders, defaultTabStop, etc.
  defaultTabStop: NonNegativeIntSchema.optional(), // Default tab stop interval in Twips
  characterSpacingControl: z.enum(['doNotCompress', 'compressPunctuation', 'compressPunctuationAndJapaneseKana']).optional(),
}).strict();
export type DocumentSettings = z.infer<typeof DocumentSettingsSchema>;

export const DocumentModelSchema = z.object({
  properties: SectionPropertiesSchema.optional(), // Default section properties for the document
  settings: DocumentSettingsSchema.optional(),
  styles: z.array(StyleDefinitionSchema).optional().default([]), // Document-wide style definitions
  numberingDefinitions: z.array(AbstractNumberingDefinitionSchema).optional().default([]), // Document-wide numbering definitions
  numberingInstances: z.array(NumberingInstanceSchema).optional().default([]),
  
  // Headers and Footers would be stored globally, referenced by sections
  // headers: z.record(NotEmptyStringSchema, HeaderFooterContentSchema).optional(), // Keyed by ref id
  // footers: z.record(NotEmptyStringSchema, HeaderFooterContentSchema).optional(), // Keyed by ref id
  
  body: z.array(DocumentBodyElementSchema), // The main content of the document
  
  // Additional document-level metadata
  creator: z.string().optional(),
  lastModifiedBy: z.string().optional(),
  createdAt: z.date().optional(),
  modifiedAt: z.date().optional(),
  title: z.string().optional(),
  subject: z.string().optional(),
  keywords: z.array(z.string()).optional(),
}).strict();
export type DocumentModel = z.infer<typeof DocumentModelSchema>;
