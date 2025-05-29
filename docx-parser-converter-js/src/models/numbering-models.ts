// src/models/numbering-models.ts
import { z } from 'zod';
import { RunPropertiesSchema } from './styles-models';
import { NonNegativeIntSchema, NotEmptyStringSchema } from '../types/common';
import { AlignmentEnum } from './styles-models'; // Assuming AlignmentEnum is in styles-models

export const NumberFormatEnum = z.enum([
  'decimal', 'upperRoman', 'lowerRoman', 'upperLetter', 'lowerLetter',
  'ordinal', 'cardinalText', 'ordinalText', 'hex', 'chiHead',
  'bullet', 'decimalZero', 'none',
  // Add more specific OpenXML numbering formats if needed
]);
export type NumberFormat = z.infer<typeof NumberFormatEnum>;

export const NumberingLevelSuffixEnum = z.enum(['tab', 'space', 'nothing']);
export type NumberingLevelSuffix = z.infer<typeof NumberingLevelSuffixEnum>;

export const NumberingLevelSchema = z.object({
  level: NonNegativeIntSchema, // The level index (0-based)
  start: NonNegativeIntSchema.optional().default(1), // Starting value for this level
  format: NumberFormatEnum.default('decimal'),
  levelText: NotEmptyStringSchema.optional(), // e.g., "%1." or "•"
  justification: AlignmentEnum.optional().default('left'), // Alignment of the number/bullet
  suffix: NumberingLevelSuffixEnum.optional().default('tab'), // What follows the number/bullet
  runProperties: RunPropertiesSchema.optional(), // Formatting for the number/bullet itself
  paragraphProperties: z.object({ // Simplified paragraph properties for indentation of the level
    indentation: z.object({
        left: NonNegativeIntSchema.optional(),
        hanging: NonNegativeIntSchema.optional(),
        firstLine: NonNegativeIntSchema.optional(), // Often used for bullet/number position
    }).optional(),
  }).optional(),
}).strict();
export type NumberingLevel = z.infer<typeof NumberingLevelSchema>;

export const AbstractNumberingDefinitionSchema = z.object({
  id: NotEmptyStringSchema, // Abstract numbering definition ID
  name: NotEmptyStringSchema.optional(), // Optional name for the definition
  levels: z.array(NumberingLevelSchema).min(1), // Must have at least one level
  // numStyleLink: NotEmptyStringSchema.optional(), // Link to a numbering style
  // styleLink: NotEmptyStringSchema.optional(), // Link to a paragraph style for default formatting
}).strict();
export type AbstractNumberingDefinition = z.infer<typeof AbstractNumberingDefinitionSchema>;

// A NumberingInstance links an abstract definition to a concrete usage in the document.
// Often, parsers might resolve this directly into paragraph properties rather than storing instances separately.
// For now, we'll define it, but its direct usage in DocumentModel might be minimal if numbering info is embedded in paragraph styles/properties.
export const NumberingInstanceSchema = z.object({
  instanceId: NotEmptyStringSchema, // Concrete instance ID
  abstractNumId: NotEmptyStringSchema, // ID of the AbstractNumberingDefinition it refers to
  // Optional overrides for levels can be defined here if needed, but usually not for simple cases.
  // levelOverrides: z.array(z.object({
  //  level: NonNegativeIntSchema,
  //  startOverride: NonNegativeIntSchema.optional()
  // })).optional(),
}).strict();
export type NumberingInstance = z.infer<typeof NumberingInstanceSchema>;
