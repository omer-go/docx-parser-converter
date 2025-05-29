// src/models/paragraph-models.ts
import { z } from 'zod';
import { RunPropertiesSchema, ParagraphPropertiesSchema } from './styles-models';
import { NotEmptyStringSchema, NonNegativeIntSchema } from '../types/common';
import { BaseModelSchema } from './base-model';

// --- Content Element Schemas ---

export const TextRunSchema = BaseModelSchema.extend({
  type: z.literal('textRun'),
  text: z.string(), // The actual text content
  properties: RunPropertiesSchema.optional(),
}).strict();
export type TextRun = z.infer<typeof TextRunSchema>;

export const HyperlinkSchema = BaseModelSchema.extend({
  type: z.literal('hyperlink'),
  url: NotEmptyStringSchema, // The target URL
  tooltip: z.string().optional(),
  // Content of the hyperlink, can be one or more text runs
  children: z.array(TextRunSchema), // For simplicity, starting with TextRun. Could be more generic.
  properties: RunPropertiesSchema.optional(), // Optional overall properties for the hyperlink text
}).strict();
export type Hyperlink = z.infer<typeof HyperlinkSchema>;

export const ImageDrawingSchema = BaseModelSchema.extend({
  type: z.literal('imageDrawing'),
  src: NotEmptyStringSchema, // Image source (e.g., path or data URL if embedded)
  title: z.string().optional(),
  alt: z.string().optional(), // Alt text for accessibility
  width: NonNegativeIntSchema, // Width in EMU
  height: NonNegativeIntSchema, // Height in EMU
  // Additional properties like positioning, wrapping can be added later
  properties: RunPropertiesSchema.optional(), // For potential styling of a frame or caption
}).strict();
export type ImageDrawing = z.infer<typeof ImageDrawingSchema>;

// Union schema for various inline content elements within a paragraph
export const ParagraphContentElementSchema = z.union([
  TextRunSchema,
  HyperlinkSchema,
  ImageDrawingSchema,
  // Add other inline elements like Drawing, Tab, Break etc. here
]);
export type ParagraphContentElement = z.infer<typeof ParagraphContentElementSchema>;

// --- Paragraph Schema ---

export const ParagraphSchema = BaseModelSchema.extend({
  type: z.literal('paragraph'),
  children: z.array(ParagraphContentElementSchema), // Array of content elements
  properties: ParagraphPropertiesSchema.optional(),
  // paragraphId for comments, revisions etc. - can be added later
}).strict();
export type Paragraph = z.infer<typeof ParagraphSchema>;
